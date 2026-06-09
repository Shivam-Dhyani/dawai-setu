import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Permission module constants — keep in sync with src/common/constants/permissions.ts
const M = {
  AUTH: 'AUTH',
  PROFILE: 'PROFILE',
  DASHBOARD: 'DASHBOARD',
  PATIENT_CASES: 'PATIENT_CASES_MANAGEMENT',
  DEFAULT_RX: 'MANAGE_DEFAULT_RX',
  REQUEST_STOCK: 'REQUEST_MEDICINE_STOCK',
  TRACK_INVENTORY: 'TRACK_MEDICINE_INVENTORY',
  GOODS_RECEIVED: 'GOODS_RECEIVED_MARK_READY',
  NEAR_EXPIRY: 'NEAR_EXPIRY_STOCK',
  EXPIRED: 'EXPIRED_STOCK',
};
const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE'];

async function main() {
  // ── Roles ──────────────────────────────────────────────────────────────────
  const doctorRole = await prisma.role.upsert({
    where: { name: 'DOCTOR' },
    update: {},
    create: { name: 'DOCTOR', isSystem: true },
  });

  const pharmacistRole = await prisma.role.upsert({
    where: { name: 'PHARMACIST' },
    update: {},
    create: { name: 'PHARMACIST', isSystem: true },
  });

  const pharmacyRole = await prisma.role.upsert({
    where: { name: 'PHARMACY' },
    update: {},
    create: { name: 'PHARMACY', isSystem: true },
  });

  // ── Permissions (PRD §6.3 module access matrix) ────────────────────────────
  const doctorModules = [M.AUTH, M.PROFILE, M.DASHBOARD, M.PATIENT_CASES, M.DEFAULT_RX];
  const pharmacistModules = [
    M.AUTH,
    M.PROFILE,
    M.DASHBOARD,
    M.REQUEST_STOCK,
    M.TRACK_INVENTORY,
    M.GOODS_RECEIVED,
    M.NEAR_EXPIRY,
    M.EXPIRED,
  ];
  const pharmacyModules = [M.AUTH, M.PROFILE, M.DASHBOARD];

  for (const [roleId, modules] of [
    [doctorRole.id, doctorModules],
    [pharmacistRole.id, pharmacistModules],
    [pharmacyRole.id, pharmacyModules],
  ] as [string, string[]][]) {
    for (const module of modules) {
      for (const action of ACTIONS) {
        await prisma.rolePermission.upsert({
          where: { roleId_module_action: { roleId, module, action } },
          update: {},
          create: { roleId, module, action },
        });
      }
    }
  }

  // ── Geography — Indian states & cities sample set ─────────────────────────
  const statesData = [
    { name: 'Delhi', code: 'DL', cities: ['New Delhi', 'Dwarka', 'Rohini'] },
    { name: 'Maharashtra', code: 'MH', cities: ['Mumbai', 'Pune', 'Nagpur'] },
    { name: 'Karnataka', code: 'KA', cities: ['Bengaluru', 'Mysuru', 'Mangaluru'] },
    { name: 'Tamil Nadu', code: 'TN', cities: ['Chennai', 'Coimbatore', 'Madurai'] },
    { name: 'Uttar Pradesh', code: 'UP', cities: ['Lucknow', 'Noida', 'Agra'] },
    { name: 'Rajasthan', code: 'RJ', cities: ['Jaipur', 'Jodhpur', 'Udaipur'] },
    { name: 'Gujarat', code: 'GJ', cities: ['Ahmedabad', 'Surat', 'Vadodara'] },
    { name: 'West Bengal', code: 'WB', cities: ['Kolkata', 'Howrah', 'Siliguri'] },
  ];

  for (const { name, code, cities } of statesData) {
    const state = await prisma.state.upsert({
      where: { code },
      update: {},
      create: { name, code },
    });
    for (const cityName of cities) {
      await prisma.city.upsert({
        where: { name_stateId: { name: cityName, stateId: state.id } },
        update: {},
        create: { name: cityName, stateId: state.id },
      });
    }
  }

  // ── Medicine master data (sample set) ─────────────────────────────────────
  const medicines = [
    { name: 'Paracetamol 500mg', indication: 'Fever, mild to moderate pain' },
    { name: 'Amoxicillin 250mg', indication: 'Bacterial infections' },
    { name: 'Metformin 500mg', indication: 'Type 2 diabetes' },
    { name: 'Atorvastatin 10mg', indication: 'High cholesterol' },
    { name: 'Omeprazole 20mg', indication: 'Acidity, ulcers, GERD' },
    { name: 'Cetirizine 10mg', indication: 'Allergies, hay fever' },
    { name: 'Azithromycin 250mg', indication: 'Respiratory tract infections' },
    { name: 'Ibuprofen 400mg', indication: 'Pain, inflammation, fever' },
    { name: 'Amlodipine 5mg', indication: 'Hypertension, angina' },
    { name: 'Losartan 50mg', indication: 'Hypertension, kidney protection' },
  ];

  for (const medicine of medicines) {
    await prisma.medicine.upsert({
      where: { name: medicine.name },
      update: {},
      create: medicine,
    });
  }

  console.warn('Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
