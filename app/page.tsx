import { mp4Option } from "./flags";
import { RecorderPage } from "@voom/RecorderPage";

/**
 * Entrypoint mínimo: monta la pantalla principal del feature (voom).
 * Toda la lógica y UI del recorder vive en (voom).
 */
export default async function Home() {
  const showMp4Option = await mp4Option();
  return <RecorderPage showMp4Option={showMp4Option} />;
}
