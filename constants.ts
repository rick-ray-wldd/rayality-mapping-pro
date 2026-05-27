export const DEFAULT_CANVAS_WIDTH = 1920;
export const DEFAULT_CANVAS_HEIGHT = 1080;

export const INITIAL_QUAD_SIZE = 300;

export const BLEND_MODES = [
  { value: 'normal', label: 'Normal' },
  { value: 'screen', label: 'Screen' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'lighten', label: 'Lighten' },
];

export interface VeoModelOption {
  id: string;
  label: string;
  tagline: string;
  costPer8s: string;
}

export const VEO_MODELS: VeoModelOption[] = [
  {
    id: 'veo-3.1-lite-generate-preview',
    label: 'Lite',
    tagline: 'Cheapest — fast drafts',
    costPer8s: '~$0.24',
  },
  {
    id: 'veo-3.1-fast-generate-preview',
    label: 'Fast',
    tagline: 'Balanced — recommended',
    costPer8s: '~$1.20',
  },
  {
    id: 'veo-3.1-generate-preview',
    label: 'Quality',
    tagline: 'Highest fidelity',
    costPer8s: '~$3.20',
  },
];

export const DEFAULT_VEO_MODEL_ID = 'veo-3.1-fast-generate-preview';

export const SYNC_CHANNEL_NAME = 'lumina_map_sync_channel';
