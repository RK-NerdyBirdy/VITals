import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DoctorCardProps = {
  name: string;
  specialty: string;
  fees: number;
  type: "GENERAL" | "SPECIALIST";
  affiliation?: string;
};

export function DoctorCard({ name, specialty, fees, type, affiliation }: DoctorCardProps) {
  return (
    <Card className="group relative min-w-[260px] overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-ticket">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-vitals-crimson via-vitals-primary-soft to-vitals-teal" />
      <CardHeader>
        <Badge variant={type === "GENERAL" ? "info" : "default"} className="mb-3 w-fit">
          {type === "GENERAL" ? "General Physician" : "Specialist"}
        </Badge>
        <CardTitle className="text-xl">{name}</CardTitle>
        <p className="text-sm text-vitals-charcoal/70">{specialty}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="text-vitals-charcoal/70">Consultation</span>
          <span className="font-semibold text-vitals-crimson">Rs {fees.toFixed(2)}</span>
        </div>
        {affiliation ? <p className="mt-3 text-xs text-vitals-charcoal/60">{affiliation}</p> : null}
      </CardContent>
    </Card>
  );
}
