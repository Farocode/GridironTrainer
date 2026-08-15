import { ordinal, fieldPos, fieldZone } from "../engine/utils";

export default function Hud({ down, distance, yardLine }) {
  return (
    <div className="hud">
      <div>
        <div className="val">{ordinal(down)} &amp; {distance}</div>
        <div className="lbl">Down</div>
      </div>
      <div>
        <div className="val">{fieldPos(yardLine)}</div>
        <div className="lbl">{fieldZone(yardLine)}</div>
      </div>
    </div>
  );
}
