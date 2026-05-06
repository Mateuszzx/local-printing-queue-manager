import { CONFIG_PATHS } from '../config/config';

export const loadAllConfigs = async () => {
  const load = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    return res.json();
  };

  const [printers, materials, infill, infill_type, statuses] = await Promise.all([
    load(CONFIG_PATHS.printers),
    load(CONFIG_PATHS.materials),
    load(CONFIG_PATHS.infill),
    load(CONFIG_PATHS.infill_type),
    load(CONFIG_PATHS.statuses)
  ]);

  return { printers, materials, infill, infill_type, statuses };
};
