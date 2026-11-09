import { PrismaClient, Role, District, SellerType, BuyerType, OperationalStatus, CropSeason, CollectionFeasibility, CollectionPointType, RoadType, RoadCondition, SourceType, TransactionType, QualityGrade, SurveyType, Month, EnvClearanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding BioChain database...');

  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@BioChain2024', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@biochain.in' },
    update: {},
    create: {
      email: 'admin@biochain.in',
      passwordHash: adminHash,
      fullName: 'BioChain Admin',
      mobile: '9876543210',
      district: District.SONITPUR,
      role: Role.ADMIN,
      isEmailVerified: true,
      isApproved: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // ── Demo Seller (Farmer from Sonitpur) ─────────────────────────────────────
  const sellerHash = await bcrypt.hash('Seller@123!', 12);
  const seller = await prisma.user.upsert({
    where: { email: 'seller@biochain.in' },
    update: {},
    create: {
      email: 'seller@biochain.in',
      passwordHash: sellerHash,
      fullName: 'Ranjit Borah',
      mobile: '9435100001',
      district: District.SONITPUR,
      role: Role.SELLER,
      isEmailVerified: true,
      isApproved: true,
      sellerProfile: {
        create: {
          sellerType: SellerType.RICE_MILL,
          organisationName: 'Borah Rice Industries',
          designation: 'Owner',
          locationArea: 'Tezpur, Sonitpur',
          latitude: 26.6338,
          longitude: 92.8005,
          operationalStatus: OperationalStatus.OPERATIONAL,
          operatingMonths: [Month.JANUARY, Month.FEBRUARY, Month.MARCH, Month.OCTOBER, Month.NOVEMBER, Month.DECEMBER],
        },
      },
    },
  });
  console.log('✅ Demo seller created:', seller.email);

  // ── Demo Buyer (Waste-to-Energy Plant) ────────────────────────────────────
  const buyerHash = await bcrypt.hash('Buyer@123!', 12);
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@biochain.in' },
    update: {},
    create: {
      email: 'buyer@biochain.in',
      passwordHash: buyerHash,
      fullName: 'Priya Sharma',
      mobile: '9435100002',
      district: District.KAMRUP,
      role: Role.BUYER,
      isEmailVerified: true,
      isApproved: true,
      buyerProfile: {
        create: {
          buyerType: BuyerType.WASTE_TO_ENERGY,
          companyName: 'Assam GreenPower Ltd',
          ownerOrOperator: 'Priya Sharma',
          locationArea: 'Guwahati Industrial Area, Kamrup',
          latitude: 26.1445,
          longitude: 91.7362,
          installedCapacityTPD: 150,
          feedstockTypesAccepted: ['Rice Husk', 'Mustard Straw', 'Municipal Waste'],
          maxMoisturePct: 25,
          maxAshPct: 15,
          gridConnectivity: true,
          envClearanceStatus: EnvClearanceStatus.OBTAINED,
          deliveryRequired: false,
        },
      },
    },
  });
  console.log('✅ Demo buyer created:', buyer.email);

  // ── Seller Profile & Sources ───────────────────────────────────────────────
  const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId: seller.id } });

  if (sellerProfile) {
    // Agricultural Sources
    await prisma.agriculturalSource.upsert({
      where: { code: 'AGR-001' },
      update: {},
      create: {
        code: 'AGR-001',
        sellerProfileId: sellerProfile.id,
        name: 'Sonitpur Paddy Fields Cluster',
        district: District.SONITPUR,
        locationArea: 'Dhekiajuli, Sonitpur',
        latitude: 26.7058,
        longitude: 92.4805,
        biomassType: 'Rice Straw',
        cropName: 'Paddy',
        cropSeason: CropSeason.KHARIF,
        annualProductionTons: 12000,
        residueRatio: 1.5,
        biomassAvailableTons: 18000,
        moisturePct: 18,
        calorificValueKcalKg: 3200,
        collectionFeasibility: CollectionFeasibility.EASY,
        currentDisposal: 'Field burning / left in field',
        priceRsTon: 800,
        availableQtyTonsMonth: 500,
        peakSeason: [Month.NOVEMBER, Month.DECEMBER],
        leanSeason: [Month.MAY, Month.JUNE, Month.JULY],
        deliveryOption: 'EX_WORKS' as any,
        notes: 'Large cluster of paddy farmers. Easy road access via NH-15.',
      },
    });

    await prisma.agriculturalSource.upsert({
      where: { code: 'AGR-002' },
      update: {},
      create: {
        code: 'AGR-002',
        sellerProfileId: sellerProfile.id,
        name: 'Tezpur Mustard Growers',
        district: District.SONITPUR,
        locationArea: 'Tezpur, Sonitpur',
        latitude: 26.6338,
        longitude: 92.8005,
        biomassType: 'Mustard Straw',
        cropName: 'Mustard',
        cropSeason: CropSeason.RABI,
        annualProductionTons: 4500,
        residueRatio: 2.0,
        biomassAvailableTons: 9000,
        moisturePct: 12,
        calorificValueKcalKg: 3800,
        collectionFeasibility: CollectionFeasibility.MODERATE,
        currentDisposal: 'Burned in field',
        priceRsTon: 600,
        availableQtyTonsMonth: 200,
        peakSeason: [Month.MARCH, Month.APRIL],
        leanSeason: [Month.JULY, Month.AUGUST],
        deliveryOption: 'EX_WORKS' as any,
      },
    });

    // Industrial Sources
    await prisma.industrialSource.upsert({
      where: { code: 'IND-001' },
      update: {},
      create: {
        code: 'IND-001',
        sellerProfileId: sellerProfile.id,
        industryName: 'Borah Rice Industries',
        industryType: 'Rice Mill',
        contactPerson: 'Ranjit Borah',
        contactMobile: '9435100001',
        district: District.SONITPUR,
        locationArea: 'Tezpur, Sonitpur',
        latitude: 26.6338,
        longitude: 92.8005,
        operationalStatus: OperationalStatus.OPERATIONAL,
        operatingMonths: [Month.OCTOBER, Month.NOVEMBER, Month.DECEMBER, Month.JANUARY, Month.FEBRUARY, Month.MARCH],
        dailyCapacityTons: 50,
        annualCapacityTons: 9000,
        biomassType: 'Rice Husk',
        dailyBiomassTons: 12,
        annualBiomassTons: 2160,
        currentDisposal: 'Sold locally at low price',
        currentPriceRsTon: 1200,
        minAcceptablePriceRsTon: 1000,
        availableQtyTonsMonth: 360,
        peakSeason: [Month.NOVEMBER, Month.DECEMBER, Month.JANUARY],
        leanSeason: [Month.MAY, Month.JUNE],
        deliveryOption: 'BOTH' as any,
        storageCapacityTons: 200,
        moisturePct: 11,
        calorificValueKcalKg: 3200,
        contaminationLevel: 'Low',
        paymentTerms: 'Advance / 7-day credit',
        contractInterest: true,
        distanceToHighwayKm: 3.5,
        roadAccessQuality: RoadCondition.GOOD,
        loadingFacilities: true,
        weighbridge: true,
      },
    });

    await prisma.industrialSource.upsert({
      where: { code: 'IND-002' },
      update: {},
      create: {
        code: 'IND-002',
        sellerProfileId: sellerProfile.id,
        industryName: 'Assam Tea Estate Residues',
        industryType: 'Tea Estate',
        contactPerson: 'Dipali Konwar',
        contactMobile: '9435100005',
        district: District.SONITPUR,
        locationArea: 'Biswanath Chariali, Sonitpur',
        latitude: 26.7289,
        longitude: 93.1527,
        operationalStatus: OperationalStatus.SEASONAL,
        operatingMonths: [Month.MARCH, Month.APRIL, Month.MAY, Month.JUNE, Month.JULY, Month.AUGUST, Month.SEPTEMBER, Month.OCTOBER, Month.NOVEMBER],
        dailyCapacityTons: 30,
        annualCapacityTons: 5400,
        biomassType: 'Tea Waste / Pruned Branches',
        dailyBiomassTons: 5,
        annualBiomassTons: 1350,
        currentDisposal: 'Composted on-site',
        currentPriceRsTon: 400,
        minAcceptablePriceRsTon: 300,
        availableQtyTonsMonth: 150,
        peakSeason: [Month.JUNE, Month.JULY, Month.AUGUST],
        leanSeason: [Month.JANUARY, Month.FEBRUARY],
        deliveryOption: 'EX_WORKS' as any,
        storageCapacityTons: 50,
        moisturePct: 35,
        calorificValueKcalKg: 2800,
        contaminationLevel: 'Low',
        paymentTerms: '15-day credit',
        contractInterest: true,
        distanceToHighwayKm: 8,
        roadAccessQuality: RoadCondition.FAIR,
        loadingFacilities: false,
        weighbridge: false,
      },
    });

    // Municipal Waste Sites
    await prisma.municipalWasteSite.upsert({
      where: { code: 'MSW-001' },
      update: {},
      create: {
        code: 'MSW-001',
        sellerProfileId: sellerProfile.id,
        city: 'Tezpur',
        wardNumber: 'W-12',
        wardName: 'Tezpur Central Ward',
        locality: 'Tezpur Market Area',
        district: District.SONITPUR,
        latitude: 26.6290,
        longitude: 92.8015,
        collectionPointType: CollectionPointType.TRANSFER_STATION,
        dailyWasteKg: 18000,
        biodegradablePct: 65,
        gardenWasteKgDay: 2000,
        foodWasteKgDay: 7000,
        marketWasteKgDay: 3500,
        moisturePct: 55,
        contaminationLevel: 'Moderate',
        segregationDone: false,
        collectionFrequency: 'Daily',
        peakDay: 'Monday (post-weekend)',
        seasonalVariationPct: 20,
        accessibility: 'Good road access',
        aggregationFeasible: true,
        responsibleAuthority: 'Tezpur Municipal Board',
      },
    });
  }

  // ── Buyer Profile & Facilities ────────────────────────────────────────────
  const buyerProfile = await prisma.buyerProfile.findUnique({ where: { userId: buyer.id } });

  if (buyerProfile) {
    await prisma.processingFacility.upsert({
      where: { code: 'FAC-001' },
      update: {},
      create: {
        code: 'FAC-001',
        buyerProfileId: buyerProfile.id,
        name: 'Assam GreenPower WtE Plant',
        facilityType: 'Waste-to-Energy',
        district: District.KAMRUP,
        locationArea: 'Guwahati Industrial Area',
        latitude: 26.1445,
        longitude: 91.7362,
        owner: 'Assam GreenPower Ltd',
        status: OperationalStatus.OPERATIONAL,
        installedCapacityTPD: 150,
        currentUtilisationPct: 72,
        feedstockAccepted: ['Rice Husk', 'Mustard Straw', 'Municipal Waste', 'Jute Waste'],
        feedstockRequirementTPD: 150,
        maxMoisturePct: 25,
        maxAshPct: 15,
        purchasePriceRsTon: 1500,
        paymentTerms: '30-day credit',
        deliveryRequired: false,
        distanceToHighwayKm: 2.0,
        gridConnectivity: true,
        envClearanceStatus: EnvClearanceStatus.OBTAINED,
        commissioningDate: new Date('2022-01-15'),
      },
    });

    await prisma.processingFacility.upsert({
      where: { code: 'FAC-002' },
      update: {},
      create: {
        code: 'FAC-002',
        buyerProfileId: buyerProfile.id,
        name: 'Kamrup Pellet Manufacturing Unit',
        facilityType: 'Pellet Unit',
        district: District.KAMRUP,
        locationArea: 'Azara, Kamrup',
        latitude: 26.1024,
        longitude: 91.6901,
        owner: 'Assam GreenPower Ltd',
        status: OperationalStatus.OPERATIONAL,
        installedCapacityTPD: 50,
        currentUtilisationPct: 60,
        feedstockAccepted: ['Rice Husk', 'Sawdust', 'Agricultural Residue'],
        feedstockRequirementTPD: 50,
        maxMoisturePct: 15,
        maxAshPct: 10,
        purchasePriceRsTon: 1200,
        paymentTerms: '15-day credit',
        deliveryRequired: true,
        distanceToHighwayKm: 5,
        gridConnectivity: true,
        envClearanceStatus: EnvClearanceStatus.OBTAINED,
        commissioningDate: new Date('2023-06-01'),
      },
    });
  }

  // ── Collection Points ─────────────────────────────────────────────────────
  await prisma.collectionPoint.upsert({
    where: { code: 'CP-001' },
    update: {},
    create: {
      code: 'CP-001',
      name: 'Tezpur Biomass Aggregation Centre',
      district: District.SONITPUR,
      locationArea: 'NH-15 Junction, Tezpur',
      latitude: 26.6500,
      longitude: 92.7800,
      storageCapacityTons: 500,
      coveredStorageSqm: 2000,
      openStorageSqm: 5000,
      loadingEquipment: true,
      weighbridge: true,
      electricity: true,
      water: true,
      security: true,
      operatingHours: '08:00 - 18:00',
      contactPerson: 'Mohan Das',
      contactMobile: '9435200001',
      storageCostRsTonDay: 15,
      handlingCostRsTon: 120,
      accessibilityRating: 4,
    },
  });

  await prisma.collectionPoint.upsert({
    where: { code: 'CP-002' },
    update: {},
    create: {
      code: 'CP-002',
      name: 'Guwahati Biomass Hub',
      district: District.KAMRUP,
      locationArea: 'Jalukbari, Kamrup Metro',
      latitude: 26.1445,
      longitude: 91.6503,
      storageCapacityTons: 800,
      coveredStorageSqm: 3500,
      openStorageSqm: 8000,
      loadingEquipment: true,
      weighbridge: true,
      electricity: true,
      water: true,
      security: true,
      operatingHours: '06:00 - 20:00',
      contactPerson: 'Anita Gogoi',
      contactMobile: '9435200002',
      storageCostRsTonDay: 18,
      handlingCostRsTon: 150,
      accessibilityRating: 5,
    },
  });

  // ── Transport Routes ──────────────────────────────────────────────────────
  await prisma.transportRoute.upsert({
    where: { code: 'TR-001' },
    update: {},
    create: {
      code: 'TR-001',
      fromLocationName: 'Tezpur (Sonitpur)',
      toLocationName: 'Guwahati (Kamrup)',
      distanceKm: 185,
      roadType: RoadType.NATIONAL_HIGHWAY,
      roadCondition: RoadCondition.GOOD,
      travelTimeHours: 4.5,
      suitableVehicle: '10-ton truck',
      fuelCostRsKm: 8.5,
      tollChargesRs: 280,
      vehicleLoadTons: 10,
      seasonalAccessibility: 'Year-round, minor flooding in monsoon',
      notes: 'Via NH-15. Good NH but heavy traffic near Guwahati.',
    },
  });

  await prisma.transportRoute.upsert({
    where: { code: 'TR-002' },
    update: {},
    create: {
      code: 'TR-002',
      fromLocationName: 'Dhekiajuli (Sonitpur)',
      toLocationName: 'Tezpur Collection Point',
      distanceKm: 45,
      roadType: RoadType.STATE_HIGHWAY,
      roadCondition: RoadCondition.FAIR,
      travelTimeHours: 1.5,
      suitableVehicle: '5-ton truck / tractor',
      fuelCostRsKm: 7,
      tollChargesRs: 0,
      vehicleLoadTons: 5,
      seasonalAccessibility: 'Limited in heavy monsoon',
      notes: 'Last-mile collection route from paddy fields.',
    },
  });

  // ── Biomass Prices ─────────────────────────────────────────────────────────
  const priceData = [
    { biomassType: 'Rice Husk', district: District.SONITPUR, market: 'Tezpur', priceRsTon: 1200, month: 0 },
    { biomassType: 'Rice Husk', district: District.SONITPUR, market: 'Tezpur', priceRsTon: 1150, month: -1 },
    { biomassType: 'Rice Husk', district: District.KAMRUP, market: 'Guwahati', priceRsTon: 1350, month: 0 },
    { biomassType: 'Rice Straw', district: District.SONITPUR, market: 'Tezpur', priceRsTon: 800, month: 0 },
    { biomassType: 'Rice Straw', district: District.SONITPUR, market: 'Tezpur', priceRsTon: 750, month: -1 },
    { biomassType: 'Mustard Straw', district: District.SONITPUR, market: 'Tezpur', priceRsTon: 600, month: 0 },
    { biomassType: 'Municipal Waste', district: District.KAMRUP, market: 'Guwahati', priceRsTon: 400, month: 0 },
    { biomassType: 'Tea Waste', district: District.SONITPUR, market: 'Biswanath', priceRsTon: 350, month: 0 },
    { biomassType: 'Jute Waste', district: District.KAMRUP, market: 'Guwahati', priceRsTon: 900, month: 0 },
  ];

  for (let i = 0; i < priceData.length; i++) {
    const p = priceData[i];
    const code = `PRC-${String(i + 1).padStart(3, '0')}`;
    const date = new Date();
    date.setMonth(date.getMonth() + (p.month || 0));
    await prisma.biomassPrice.upsert({
      where: { code },
      update: {},
      create: {
        code,
        date,
        biomassType: p.biomassType,
        district: p.district,
        market: p.market,
        sourceType: SourceType.INDUSTRY_GATE,
        priceRsTon: p.priceRsTon,
        priceRsQuintal: p.priceRsTon / 10,
        qualityGrade: QualityGrade.B,
        transactionType: TransactionType.SPOT,
        seasonalFactor: 1.0,
        dataSource: 'BioChain Demo Seed',
      },
    });
  }

  // ── Seasonal Availability ─────────────────────────────────────────────────
  const months: Month[] = [Month.JANUARY, Month.FEBRUARY, Month.MARCH, Month.APRIL, Month.MAY, Month.JUNE, Month.JULY, Month.AUGUST, Month.SEPTEMBER, Month.OCTOBER, Month.NOVEMBER, Month.DECEMBER];
  const riceHuskByMonth = [300, 280, 250, 150, 80, 50, 50, 60, 100, 400, 500, 450];
  const mustardByMonth = [50, 80, 200, 180, 50, 20, 10, 10, 20, 30, 40, 60];

  for (let mi = 0; mi < 12; mi++) {
    const rhCode = `SEA-${String(mi + 1).padStart(3, '0')}`;
    await prisma.seasonalAvailability.upsert({
      where: { code: rhCode },
      update: {},
      create: {
        code: rhCode,
        biomassType: 'Rice Husk',
        crop: 'Paddy',
        district: District.SONITPUR,
        month: months[mi],
        availabilityTons: riceHuskByMonth[mi],
        harvestPeriod: mi >= 9 ? 'Post-Kharif harvest' : 'Off-season',
        peakAvailability: 500,
        moisturePct: 11,
        collectionWindowDays: 30,
        year: new Date().getFullYear(),
      },
    });

    const msCode = `SEA-${String(mi + 13).padStart(3, '0')}`;
    await prisma.seasonalAvailability.upsert({
      where: { code: msCode },
      update: {},
      create: {
        code: msCode,
        biomassType: 'Mustard Straw',
        crop: 'Mustard',
        district: District.SONITPUR,
        month: months[mi],
        availabilityTons: mustardByMonth[mi],
        harvestPeriod: mi >= 2 && mi <= 3 ? 'Post-Rabi harvest' : 'Off-season',
        peakAvailability: 200,
        moisturePct: 12,
        collectionWindowDays: 21,
        year: new Date().getFullYear(),
      },
    });
  }

  // ── Survey Progress ─────────────────────────────────────────────────────────
  const surveyData = [
    { type: SurveyType.AGRICULTURAL, district: District.SONITPUR, target: 50, completed: 32 },
    { type: SurveyType.AGRICULTURAL, district: District.KAMRUP, target: 40, completed: 18 },
    { type: SurveyType.INDUSTRIAL, district: District.SONITPUR, target: 30, completed: 22 },
    { type: SurveyType.INDUSTRIAL, district: District.KAMRUP, target: 25, completed: 20 },
    { type: SurveyType.MUNICIPAL, district: District.SONITPUR, target: 15, completed: 12 },
    { type: SurveyType.MUNICIPAL, district: District.KAMRUP, target: 20, completed: 15 },
    { type: SurveyType.COLLECTION_POINT, district: District.SONITPUR, target: 10, completed: 8 },
    { type: SurveyType.COLLECTION_POINT, district: District.KAMRUP, target: 10, completed: 6 },
    { type: SurveyType.PROCESSING_FACILITY, district: District.SONITPUR, target: 8, completed: 5 },
    { type: SurveyType.PROCESSING_FACILITY, district: District.KAMRUP, target: 12, completed: 9 },
    { type: SurveyType.TRANSPORT_ROUTE, district: District.SONITPUR, target: 20, completed: 14 },
    { type: SurveyType.TRANSPORT_ROUTE, district: District.KAMRUP, target: 20, completed: 11 },
  ];

  for (const sd of surveyData) {
    await prisma.surveyProgress.upsert({
      where: { surveyType_district: { surveyType: sd.type, district: sd.district } },
      update: { completedCount: sd.completed, completionPct: (sd.completed / sd.target) * 100 },
      create: {
        surveyType: sd.type,
        district: sd.district,
        targetCount: sd.target,
        completedCount: sd.completed,
        completionPct: parseFloat(((sd.completed / sd.target) * 100).toFixed(1)),
      },
    });
  }

  // ── Demo Listings ─────────────────────────────────────────────────────────
  const riceHuskSource = await prisma.industrialSource.findUnique({ where: { code: 'IND-001' } });
  if (riceHuskSource) {
    await prisma.listing.upsert({
      where: { id: 'listing-seed-001' },
      update: {},
      create: {
        id: 'listing-seed-001',
        sellerUserId: seller.id,
        biomassType: 'Rice Husk',
        quantityTonsMonth: 300,
        priceRsTon: 1200,
        moisturePct: 11,
        qualityGrade: QualityGrade.A,
        calorificValueKcalKg: 3200,
        availabilityStartDate: new Date(),
        availabilityEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        peakMonths: [Month.NOVEMBER, Month.DECEMBER, Month.JANUARY],
        leanMonths: [Month.MAY, Month.JUNE],
        deliveryOption: 'BOTH' as any,
        district: District.SONITPUR,
        locationArea: 'Tezpur, Sonitpur',
        latitude: 26.6338,
        longitude: 92.8005,
        description: 'High quality rice husk from certified rice mill. Low moisture, excellent calorific value. Suitable for WtE plants and brick kilns.',
        status: 'ACTIVE' as any,
        industrialSourceId: riceHuskSource.id,
      },
    });
  }

  const riceStrawSource = await prisma.agriculturalSource.findUnique({ where: { code: 'AGR-001' } });
  if (riceStrawSource) {
    await prisma.listing.upsert({
      where: { id: 'listing-seed-002' },
      update: {},
      create: {
        id: 'listing-seed-002',
        sellerUserId: seller.id,
        biomassType: 'Rice Straw',
        quantityTonsMonth: 400,
        priceRsTon: 800,
        moisturePct: 18,
        qualityGrade: QualityGrade.B,
        calorificValueKcalKg: 3200,
        availabilityStartDate: new Date('2024-11-01'),
        availabilityEndDate: new Date('2025-02-28'),
        peakMonths: [Month.NOVEMBER, Month.DECEMBER],
        leanMonths: [Month.MAY, Month.JUNE, Month.JULY],
        deliveryOption: 'EX_WORKS' as any,
        district: District.SONITPUR,
        locationArea: 'Dhekiajuli, Sonitpur',
        latitude: 26.7058,
        longitude: 92.4805,
        description: 'Surplus rice straw from paddy harvest. Collected and baled at farm gate. Currently being burned — looking for bulk buyer.',
        status: 'ACTIVE' as any,
        agriculturalSourceId: riceStrawSource.id,
      },
    });
  }

  console.log('✅ Demo listings created');
  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Login credentials:');
  console.log('  Admin:  admin@biochain.in  / Admin@BioChain2024');
  console.log('  Seller: seller@biochain.in / Seller@123!');
  console.log('  Buyer:  buyer@biochain.in  / Buyer@123!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
