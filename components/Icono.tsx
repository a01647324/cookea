import { memo } from "react";
import { SvgXml } from "react-native-svg";
import { getIconData, iconToSVG, iconToHTML } from "@iconify/utils";
import type { IconifyJSON } from "@iconify/types";
import iconos from "../assets/iconos.json";

export type NombreIcono = keyof typeof iconos.icons;

type Props = {
  nombre: NombreIcono;
  size?: number;
  color?: string;
};

const cache = new Map<string, string>();

function obtenerSvg(nombre: string) {
  const guardado = cache.get(nombre);
  if (guardado) return guardado;

  const datos = getIconData(iconos as IconifyJSON, nombre);
  if (!datos) return null;

  const { attributes, body } = iconToSVG(datos, { height: "auto" });
  const svg = iconToHTML(body, attributes);
  cache.set(nombre, svg);
  return svg;
}

function Icono({ nombre, size = 24, color = "#263133" }: Props) {
  const svg = obtenerSvg(nombre);
  if (!svg) return null;
  return <SvgXml xml={svg.replaceAll("currentColor", color)} width={size} height={size} />;
}

export default memo(Icono);
