import { redirect } from "next/navigation";

/** O escopo do modelo virou painel lateral dentro da área de trabalho. */
export default function EscopoPage() {
  redirect("/workspace?painel=escopo");
}
