"""initial schema

Revision ID: 20260409_0001
Revises:
Create Date: 2026-04-09 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260409_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec_statements(sql: str) -> None:
  # asyncpg does not allow multiple SQL commands in a single prepared statement.
  for statement in [part.strip() for part in sql.split(";") if part.strip()]:
    op.execute(sa.text(statement))


def upgrade() -> None:
  _exec_statements(
        """
        CREATE EXTENSION IF NOT EXISTS pgcrypto;

        CREATE TYPE user_role AS ENUM ('STUDENT', 'FACULTY', 'ADMIN');
        CREATE TYPE doctor_type AS ENUM ('GENERAL', 'SPECIALIST');
        CREATE TYPE slot_status AS ENUM ('AVAILABLE', 'LOCKED', 'BOOKED', 'CANCELLED');
        CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
        CREATE TYPE order_status AS ENUM ('PENDING', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED');
        CREATE TYPE record_type AS ENUM ('PRESCRIPTION', 'REPORT', 'DISCHARGE_SUMMARY', 'VACCINATION');

        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          role user_role NOT NULL DEFAULT 'STUDENT',
          avatar_url TEXT,
          reg_number TEXT,
          department TEXT,
          parent_id UUID REFERENCES users(id),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX idx_users_email ON users(email);
        CREATE INDEX idx_users_parent ON users(parent_id);

        CREATE TABLE doctors (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          specialty TEXT NOT NULL,
          type doctor_type NOT NULL,
          qualification TEXT,
          affiliation TEXT,
          phone TEXT,
          email TEXT,
          fees NUMERIC(8,2) NOT NULL DEFAULT 0,
          image_url TEXT,
          bio TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE doctor_availability (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
          day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          max_patients INTEGER DEFAULT 20
        );

        CREATE TABLE opd_slots (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          status slot_status DEFAULT 'AVAILABLE',
          patient_id UUID REFERENCES users(id),
          locked_until TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE UNIQUE INDEX idx_slots_doctor_date_time ON opd_slots(doctor_id, date, start_time);
        CREATE INDEX idx_slots_date_status ON opd_slots(date, status);

        CREATE TABLE opd_bookings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          patient_id UUID NOT NULL REFERENCES users(id),
          doctor_id UUID NOT NULL REFERENCES doctors(id),
          booking_date DATE NOT NULL,
          booking_time TIME NOT NULL,
          status booking_status DEFAULT 'CONFIRMED',
          symptoms TEXT,
          notes TEXT,
          qr_code_data TEXT,
          qr_code_url TEXT,
          ticket_number TEXT UNIQUE,
          fees_paid NUMERIC(8,2),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX idx_bookings_patient ON opd_bookings(patient_id);
        CREATE INDEX idx_bookings_doctor_date ON opd_bookings(doctor_id, booking_date);

        CREATE TABLE lab_tests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          preparation TEXT,
          price NUMERIC(8,2) NOT NULL,
          is_profile BOOLEAN DEFAULT FALSE,
          turnaround_hrs INTEGER DEFAULT 24,
          category TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE lab_test_profile_items (
          profile_id UUID NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
          test_id UUID NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
          PRIMARY KEY (profile_id, test_id)
        );

        CREATE TABLE lab_orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          patient_id UUID NOT NULL REFERENCES users(id),
          status order_status DEFAULT 'PENDING',
          total_amount NUMERIC(10,2) NOT NULL,
          appointment_date DATE,
          appointment_time TIME,
          qr_code_data TEXT,
          qr_code_url TEXT,
          ticket_number TEXT UNIQUE,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE lab_order_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
          test_id UUID NOT NULL REFERENCES lab_tests(id),
          price_at_order NUMERIC(8,2) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX idx_orders_patient ON lab_orders(patient_id);

        CREATE TABLE medical_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          patient_id UUID NOT NULL REFERENCES users(id),
          uploaded_by UUID NOT NULL REFERENCES users(id),
          type record_type NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          file_path TEXT NOT NULL,
          encryption_key_ref TEXT NOT NULL,
          file_size_bytes BIGINT,
          mime_type TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX idx_records_patient ON medical_records(patient_id);

        CREATE TABLE record_share_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          accessed_count INTEGER DEFAULT 0,
          max_accesses INTEGER DEFAULT 1,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """
    )


def downgrade() -> None:
      _exec_statements(
        """
        DROP TABLE IF EXISTS record_share_tokens;
        DROP TABLE IF EXISTS medical_records;
        DROP TABLE IF EXISTS lab_order_items;
        DROP TABLE IF EXISTS lab_orders;
        DROP TABLE IF EXISTS lab_test_profile_items;
        DROP TABLE IF EXISTS lab_tests;
        DROP TABLE IF EXISTS opd_bookings;
        DROP TABLE IF EXISTS opd_slots;
        DROP TABLE IF EXISTS doctor_availability;
        DROP TABLE IF EXISTS doctors;
        DROP TABLE IF EXISTS users;

        DROP TYPE IF EXISTS record_type;
        DROP TYPE IF EXISTS order_status;
        DROP TYPE IF EXISTS booking_status;
        DROP TYPE IF EXISTS slot_status;
        DROP TYPE IF EXISTS doctor_type;
        DROP TYPE IF EXISTS user_role;
        """
    )
