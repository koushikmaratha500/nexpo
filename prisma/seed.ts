import "dotenv/config";
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/api/services/auth.service';

async function main() {
    console.log('🌱 Seeding currencies...');

    const currencies = [
        { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
        { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
        { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    ];

    for (const currency of currencies) {
        await prisma.currency.upsert({
            where: { code: currency.code },
            update: {},
            create: {
                ...currency,
                status: 'A',
            },
        });
    }

    console.log('🌱 Seeding countries with linked currencies...');

    const countries = [
        { name: 'India', isoCode: 'IN', currencyCode: 'INR' },
        { name: 'United States', isoCode: 'US', currencyCode: 'USD' },
        { name: 'United Kingdom', isoCode: 'GB', currencyCode: 'GBP' },
        { name: 'Germany', isoCode: 'DE', currencyCode: 'EUR' },
        { name: 'France', isoCode: 'FR', currencyCode: 'EUR' },
        { name: 'United Arab Emirates', isoCode: 'AE', currencyCode: 'AED' },
        { name: 'Singapore', isoCode: 'SG', currencyCode: 'SGD' },
        { name: 'Australia', isoCode: 'AU', currencyCode: 'AUD' },
        { name: 'Canada', isoCode: 'CA', currencyCode: 'CAD' },
        { name: 'Japan', isoCode: 'JP', currencyCode: 'JPY' },
    ];

    for (const country of countries) {
        const currency = await prisma.currency.findUnique({
            where: { code: country.currencyCode },
        });

        if (!currency) {
            console.warn(`Currency ${country.currencyCode} not found for country ${country.name}`);
        }

        await prisma.country.upsert({
            where: { isoCode: country.isoCode },
            update: {
                currencyId: currency ? currency.id : null,
            },
            create: {
                name: country.name,
                isoCode: country.isoCode,
                currencyId: currency ? currency.id : null,
                status: 'A',
            },
        });
    }

    console.log('🌱 Seeding categories...');

    const categories = [
        'Food',
        'Travel',
        'Fuel',
        'Shopping',
        'Healthcare',
        'Entertainment',
        'Utilities',
        'Loans',
        'CreditCard',
        'Education',
        'Investments',
        'Rent',
        'Insurance',
        'Taxes',
        'Salary',
        'Miscellaneous',
    ];

    for (const name of categories) {
        await prisma.category.upsert({
            where: { name },
            update: {},
            create: {
                name,
                code: name.toUpperCase().trim(),
                status: 'A',
            },
        });
    }

    console.log('🌱 Seeding payment types...');

    const paymentTypes = [
        'Credit Card',
        'Debit Card',
        'Cash',
        'Bank Transfer',
        'Net Banking',
        'UPI',
        'Wallet',
        'Cheque',
    ];

    for (const name of paymentTypes) {
        await prisma.paymentType.upsert({
            where: { name },
            update: {},
            create: {
                name,
                code: name.toUpperCase().replace(/\s+/g, '_').trim(),
                status: 'A',
            },
        });
    }

    console.log('🌱 Seeding budget deposit types...');

    const budgetDepositTypes = ['Cash', 'Account'];

    for (const name of budgetDepositTypes) {
        await prisma.budgetDepositType.upsert({
            where: { name },
            update: {},
            create: {
                name,
                code: name.toUpperCase().trim(),
                status: 'A',
            },
        });
    }

    if (process.env.SEED_DEMO_DATA !== 'true') {
        console.log('ℹ️  Skipping demo admin/customer accounts (set SEED_DEMO_DATA=true to seed them).');
        console.log('✅ Seed completed');
        return;
    }

    console.log('🌱 Seeding demo admin and customer accounts...');
    const adminEmail = 'admin@nexpo.com';
    const userEmail = 'user@nexpo.com';
    const demoPassword = process.env.SEED_DEMO_PASSWORD || 'ChangeMe-Demo-123!';
    const passwordHash = hashPassword(demoPassword);

    await prisma.admin.upsert({
        where: { email: adminEmail },
        update: {
            passwordHash,
            firstName: 'Admin',
            lastName: 'CoreOps',
            status: 'A',
        },
        create: {
            email: adminEmail,
            passwordHash,
            firstName: 'Admin',
            lastName: 'CoreOps',
            status: 'A',
        },
    });

    console.log('🌱 Seeding customer user...');

    const india = await prisma.country.findUnique({ where: { isoCode: 'IN' } });
    const inr = await prisma.currency.findUnique({ where: { code: 'INR' } });

    await prisma.user.upsert({
        where: { email: userEmail },
        update: {
            username: 'alex_sterling',
            passwordHash,
            firstName: 'Alex',
            lastName: 'Sterling',
            status: 'A',
            countryId: india ? india.id : null,
            currencyId: inr ? inr.id : null,
            emailVerified: true,
        },
        create: {
            username: 'alex_sterling',
            email: userEmail,
            passwordHash,
            firstName: 'Alex',
            lastName: 'Sterling',
            status: 'A',
            countryId: india ? india.id : null,
            currencyId: inr ? inr.id : null,
            emailVerified: true,
        },
    });

    console.log('🌱 Seeding system settings...');

    const systemSettings = [
        { key: 'baseCurrency', value: 'INR' },
        { key: 'matchingRate', value: 90 },
        { key: 'requireReceipt', value: true },
        { key: 'autoApproveLimit', value: 100 },
        { key: 'notifications.pushEnabled', value: true },
        { key: 'notifications.emailRemindersEnabled', value: true },
        { key: 'notifications.inAppEnabled', value: true },
        { key: 'notifications.defaultChannels', value: ['IN_APP'] },
    ];

    for (const setting of systemSettings) {
        await prisma.systemSetting.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: { key: setting.key, value: setting.value },
        });
    }

    console.log('✅ Seed completed');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });