import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <Button className="cursor-pointer" onClick={()=> router.push("/sign-in")}>Login</Button>
    </div>
  );
}
