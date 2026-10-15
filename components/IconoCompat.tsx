import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Icono, { NombreIcono } from './Icono';
import iconos from '../assets/iconos.json';

// Las pantallas que aún mandan nombres de Ionicons se ven con su equivalente de Solar.
const EQUIVALENTES: Record<string, NombreIcono> = {
  'trash-outline': 'trash-bin-trash-linear',
  'create-outline': 'pen-linear',
  'flag-outline': 'flag-linear',
  'camera-outline': 'camera-linear',
  'images-outline': 'gallery-linear',
  'close-circle-outline': 'close-circle-linear',
  'bookmark-outline': 'bookmark-linear',
  'book-outline': 'notebook-linear',
  'swap-horizontal-outline': 'transfer-horizontal-linear',
  'remove-circle-outline': 'minus-circle-linear',
  'eye-outline': 'eye-linear',
  'warning-outline': 'danger-triangle-linear',
  'heart-outline': 'heart-linear',
  'calendar-outline': 'calendar-linear',
  'refresh-outline': 'refresh-linear',
  'checkmark-circle-outline': 'check-circle-linear',
  'information-circle-outline': 'info-circle-linear',
};

export type NombreIconoCompat = NombreIcono | keyof typeof Ionicons.glyphMap;

interface Props {
  nombre: NombreIconoCompat;
  size?: number;
  color?: string;
}

export function IconoCompat({ nombre, size = 24, color }: Props) {
  const solar = nombre in iconos.icons ? (nombre as NombreIcono) : EQUIVALENTES[nombre];
  if (solar) return <Icono nombre={solar} size={size} color={color} />;
  return <Ionicons name={nombre as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
}
