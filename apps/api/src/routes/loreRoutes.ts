import type { Router } from 'express';
import { pool } from '../db.js';

export function registerLoreRoutes(router: Router) {
  router.get('/lore/planes', async (_req, res) => {
    const { rows } = await pool.query(
      'select id, code, name, era_tags as "eraTags", is_active as "isActive" from lore_planes where is_active = true order by name asc'
    );
    return res.json({ items: rows });
  });

  router.get('/lore/factions', async (req, res) => {
    const planeCode = String(req.query.planeCode ?? '').trim();
    if (!planeCode) return res.status(400).json({ error: 'planeCode is required' });

    const { rows } = await pool.query(
      'select f.id, f.plane_id as "planeId", f.code, f.name, f.color_identity as "colorIdentity", f.allowed_kinships as "allowedKinships", f.is_active as "isActive" from lore_factions f join lore_planes p on p.id = f.plane_id where p.code = $1 and f.is_active = true order by f.name asc',
      [planeCode]
    );
    return res.json({ items: rows });
  });

  router.get('/lore/kinships', async (req, res) => {
    const planeCode = String(req.query.planeCode ?? '').trim();

    if (!planeCode) {
      const { rows } = await pool.query(
        'select id, creature_type as "creatureType", plane_codes as "planeCodes", is_active as "isActive" from lore_kinships where is_active = true order by creature_type asc'
      );
      return res.json({ items: rows });
    }

    const { rows } = await pool.query(
      'select id, creature_type as "creatureType", plane_codes as "planeCodes", is_active as "isActive" from lore_kinships where is_active = true and $1 = any(plane_codes) order by creature_type asc',
      [planeCode]
    );
    return res.json({ items: rows });
  });

  router.get('/lore/classes', async (_req, res) => {
    const { rows } = await pool.query(
      'select id, code, name, description, allowed_archetypes as "allowedArchetypeCodes", is_active as "isActive" from lore_classes where is_active = true order by name asc'
    );
    return res.json({ items: rows });
  });

  router.get('/lore/archetypes', async (_req, res) => {
    const { rows } = await pool.query(
      'select id, code, name, description, required_tags as "requiredTags", banned_tags as "bannedTags", is_active as "isActive" from lore_archetypes where is_active = true order by name asc'
    );
    return res.json({ items: rows });
  });
}
