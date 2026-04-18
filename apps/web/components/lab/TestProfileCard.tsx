import { TestCard } from "@/components/lab/TestCard";

type TestProfileCardProps = {
  id: string;
  name: string;
  category: string;
  price: number;
  turnaroundHours: number;
  tests: string[];
};

export function TestProfileCard(props: TestProfileCardProps) {
  return (
    <TestCard
      id={props.id}
      name={props.name}
      category={props.category}
      price={props.price}
      turnaroundHours={props.turnaroundHours}
      isProfile
      includedTests={props.tests}
      preparation="Profile package"
    />
  );
}
