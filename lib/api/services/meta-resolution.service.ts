import { MetaRepository } from '../repositories/meta.repository';

function str(data: Record<string, unknown>, key: string): string | undefined {
  const val = data[key];
  return typeof val === 'string' ? val : undefined;
}

export class MetaResolutionService {
  static async resolveForTransaction(data: Record<string, unknown>) {
    let categoryId = str(data, 'categoryId') || null;
    const categoryName = str(data, 'category') || str(data, 'categoryName');
    if (!categoryId && categoryName) {
      categoryId = (await MetaRepository.findOrCreateCategory(categoryName)).id;
    }
    if (!categoryId) {
      categoryId = await MetaRepository.getDefaultCategoryId();
    }

    let currencyId = str(data, 'currencyId') || null;
    const currencyCode = str(data, 'currency') || str(data, 'currencyCode') || 'INR';
    if (!currencyId) {
      currencyId = (await MetaRepository.findOrCreateCurrency(currencyCode)).id;
    }

    let paymentTypeId = str(data, 'paymentTypeId') || null;
    const paymentTypeName = str(data, 'paymentType') || str(data, 'paymentTypeName') || 'Credit Card';
    if (!paymentTypeId) {
      paymentTypeId = (await MetaRepository.findOrCreatePaymentType(paymentTypeName)).id;
    }

    let budgetDepositTypeId = str(data, 'budgetDepositTypeId') || null;
    const depositTypeName = str(data, 'budgetDepositType') || str(data, 'category');
    if (!budgetDepositTypeId && depositTypeName) {
      budgetDepositTypeId = (await MetaRepository.findOrCreateBudgetDepositType(depositTypeName)).id;
    }

    let budgetTypeId = str(data, 'budgetTypeId') || null;
    const budgetTypeName = str(data, 'budgetType') || 'Regular';
    if (!budgetTypeId) {
      budgetTypeId = (await MetaRepository.findOrCreateBudgetType(budgetTypeName)).id;
    }

    return { categoryId, currencyId, paymentTypeId, budgetDepositTypeId, budgetTypeId };
  }

  static async resolveForExpense(data: Record<string, unknown>) {
    let categoryId = str(data, 'categoryId') || null;
    const categoryName = str(data, 'category') || str(data, 'categoryName');
    if (!categoryId && categoryName) {
      categoryId = (await MetaRepository.findOrCreateCategory(categoryName)).id;
    }
    if (!categoryId) {
      categoryId = await MetaRepository.getDefaultCategoryId();
    }

    let currencyId = str(data, 'currencyId') || null;
    const currencyCode = str(data, 'currency') || str(data, 'currencyCode') || 'INR';
    if (!currencyId) {
      currencyId = (await MetaRepository.findOrCreateCurrency(currencyCode)).id;
    }

    let paymentTypeId = str(data, 'paymentTypeId') || null;
    const paymentTypeName = str(data, 'paymentType') || str(data, 'paymentTypeName') || 'Credit Card';
    if (!paymentTypeId) {
      paymentTypeId = (await MetaRepository.findOrCreatePaymentType(paymentTypeName)).id;
    }

    return { categoryId, currencyId, paymentTypeId };
  }

  static async resolveForDeposit(data: Record<string, unknown>) {
    let currencyId = str(data, 'currencyId') || null;
    const currencyCode = str(data, 'currency') || str(data, 'currencyCode') || 'INR';
    if (!currencyId) {
      currencyId = (await MetaRepository.findOrCreateCurrency(currencyCode)).id;
    }

    let budgetDepositTypeId = str(data, 'budgetDepositTypeId') || null;
    const depositTypeName = str(data, 'category') || str(data, 'budgetDepositType') || 'Other';
    if (!budgetDepositTypeId) {
      budgetDepositTypeId = (await MetaRepository.findOrCreateBudgetDepositType(depositTypeName)).id;
    }

    let paymentTypeId = str(data, 'paymentTypeId') || null;
    const paymentTypeName = str(data, 'type') || str(data, 'paymentType') || 'Account';
    if (!paymentTypeId) {
      paymentTypeId = (await MetaRepository.findOrCreatePaymentType(paymentTypeName)).id;
    }

    let budgetTypeId = str(data, 'budgetTypeId') || null;
    const budgetTypeName = str(data, 'budgetType') || 'Regular';
    if (!budgetTypeId) {
      budgetTypeId = (await MetaRepository.findOrCreateBudgetType(budgetTypeName)).id;
    }

    return { currencyId, budgetDepositTypeId, paymentTypeId, budgetTypeId };
  }
}
