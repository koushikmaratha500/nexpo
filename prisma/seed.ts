import "dotenv/config";
import { prisma } from '../lib/prisma';

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

    console.log('🌱 Seeding admin user...');
    const adminEmail = 'admin@nexpo.com';
    const passwordHash = '77257610b3c9ca33bccc9e7fbd8f7509:a9a9acaeb65c6a25f100f040f9ad06cb626df013bf53e86de16f696a30f3c519c8e61c57ad7ff303eb6410ca363dbb6fad50a591aebfffee272c2dbbe7a550c7'; // nexpo-ultra-secure-secret-key-1230456

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
    const userEmail = 'user@nexpo.com';

    const india = await prisma.country.findUnique({ where: { isoCode: 'IN' } });
    const inr = await prisma.currency.findUnique({ where: { code: 'INR' } });

    await prisma.user.upsert({
        where: { email: userEmail },
        update: {
            passwordHash,
            firstName: 'Alex',
            lastName: 'Sterling',
            status: 'A',
            countryId: india ? india.id : null,
            currencyId: inr ? inr.id : null,
            emailVerified: true,
        },
        create: {
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