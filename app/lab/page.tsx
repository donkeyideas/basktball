import { permanentRedirect } from "next/navigation";

export default function LabRedirect(): never {
  permanentRedirect("/cards?tab=lab");
}
