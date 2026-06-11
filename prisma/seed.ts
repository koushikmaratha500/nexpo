import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    ];

    for (const currency of currencies) {
        await prisma.currency.upsert({
            where: { code: currency.code },
            update: {},
            create: currency,
        });
    }

    const currencyMap = await prisma.currency.findMany();

    const getCurrencyId = (code: string) =>
        currencyMap.find((c) => c.code === code)?.id!;

    console.log('🌱 Seeding countries...');

    const countries = [
        {
            name: 'India',
            isoCode: 'IN',
            defaultCurrencyId: getCurrencyId('INR'),
        },
        {
            name: 'United States',
            isoCode: 'US',
            defaultCurrencyId: getCurrencyId('USD'),
        },
        {
            name: 'United Kingdom',
            isoCode: 'GB',
            defaultCurrencyId: getCurrencyId('GBP'),
        },
        {
            name: 'Germany',
            isoCode: 'DE',
            defaultCurrencyId: getCurrencyId('EUR'),
        },
        {
            name: 'France',
            isoCode: 'FR',
            defaultCurrencyId: getCurrencyId('EUR'),
        },
        {
            name: 'United Arab Emirates',
            isoCode: 'AE',
            defaultCurrencyId: getCurrencyId('AED'),
        },
        {
            name: 'Singapore',
            isoCode: 'SG',
            defaultCurrencyId: getCurrencyId('SGD'),
        },
        {
            name: 'Australia',
            isoCode: 'AU',
            defaultCurrencyId: getCurrencyId('AUD'),
        },
        {
            name: 'Canada',
            isoCode: 'CA',
            defaultCurrencyId: getCurrencyId('CAD'),
        },
        {
            name: 'Japan',
            isoCode: 'JP',
            defaultCurrencyId: getCurrencyId('JPY'),
        },
    ];

    for (const country of countries) {
        await prisma.country.upsert({
            where: { isoCode: country.isoCode },
            update: {},
            create: country,
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
                isActive: true,
            },
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