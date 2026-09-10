import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfileFieldSettings } from '@/hooks/useProfileFieldSettings';
import {
  calculateCashFlowFromNumbers,
  getCashFlowLabel,
  formatCurrency,
} from '@/lib/cashFlowCalculator';

interface CashFlowSectionProps {
  monthlyIncome: string;
  setMonthlyIncome: (value: string) => void;
  monthlyDebtPayments: string;
  setMonthlyDebtPayments: (value: string) => void;
  monthlyHousing: string;
  setMonthlyHousing: (value: string) => void;
  monthlyInsurance: string;
  setMonthlyInsurance: (value: string) => void;
  monthlyLivingExpenses: string;
  setMonthlyLivingExpenses: (value: string) => void;
}

function CurrencyInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  helperText,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and empty string
    const val = e.target.value.replace(/[^0-9]/g, '');
    onChange(val);
  };

  const displayValue = value ? `$${Number(value).toLocaleString()}` : '';

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          value={value ? Number(value).toLocaleString() : ''}
          onChange={handleChange}
          placeholder={placeholder || '0'}
          className="pl-9"
        />
      </div>
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

export function CashFlowSection({
  monthlyIncome,
  setMonthlyIncome,
  monthlyDebtPayments,
  setMonthlyDebtPayments,
  monthlyHousing,
  setMonthlyHousing,
  monthlyInsurance,
  setMonthlyInsurance,
  monthlyLivingExpenses,
  setMonthlyLivingExpenses,
}: CashFlowSectionProps) {
  const { isVisible } = useProfileFieldSettings();
  const fixedObligationVisible = isVisible('monthly_debt_payments') || isVisible('monthly_housing') || isVisible('monthly_insurance');

  const cashFlowResult = useMemo(() => {
    const income = Number(monthlyIncome) || 0;
    const debt = Number(monthlyDebtPayments) || 0;
    const housing = Number(monthlyHousing) || 0;
    const insurance = Number(monthlyInsurance) || 0;
    const living = Number(monthlyLivingExpenses) || 0;

    // Only calculate if at least income is provided
    if (income === 0) return null;

    return calculateCashFlowFromNumbers(income, debt, housing, insurance, living);
  }, [monthlyIncome, monthlyDebtPayments, monthlyHousing, monthlyInsurance, monthlyLivingExpenses]);

  const iconMap = {
    surplus: TrendingUp,
    tight: Minus,
    deficit: TrendingDown,
  };

  const colorMap = {
    surplus: 'text-green-600 bg-green-50 border-green-200',
    tight: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    deficit: 'text-red-600 bg-red-50 border-red-200',
  };

  const Icon = cashFlowResult ? iconMap[cashFlowResult.status] : null;

  return (
    <div className="space-y-4">
      <Separator />
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Your River — Cash Flow
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Used for personalized debt and strategy recommendations
        </p>
      </div>

      {/* Net Monthly Income */}
      {isVisible('monthly_income') && (
      <CurrencyInput
        id="monthly_income"
        label="Net Monthly Income"
        value={monthlyIncome}
        onChange={setMonthlyIncome}
        helperText="Your take-home pay after taxes"
      />
      )}

      {/* Fixed Obligations */}
      {fixedObligationVisible && (
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Monthly Fixed Obligations
        </p>
        <div className="grid grid-cols-2 gap-3">
          {isVisible('monthly_debt_payments') && (
          <CurrencyInput
            id="monthly_debt"
            label="Debt Payments"
            value={monthlyDebtPayments}
            onChange={setMonthlyDebtPayments}
            helperText="Total minimums"
          />
          )}
          {isVisible('monthly_housing') && (
          <CurrencyInput
            id="monthly_housing"
            label="Housing"
            value={monthlyHousing}
            onChange={setMonthlyHousing}
            helperText="Rent/mortgage"
          />
          )}
        </div>
        {isVisible('monthly_insurance') && (
        <CurrencyInput
          id="monthly_insurance"
          label="Insurance"
          value={monthlyInsurance}
          onChange={setMonthlyInsurance}
          helperText="All insurance combined"
        />
        )}
      </div>
      )}

      {/* Living Expenses */}
      {isVisible('monthly_living_expenses') && (
      <CurrencyInput
        id="monthly_living"
        label="Monthly Living Expenses"
        value={monthlyLivingExpenses}
        onChange={setMonthlyLivingExpenses}
        helperText="Food, gas, utilities, subscriptions (estimate)"
      />
      )}

      {/* Live Calculation Preview */}
      {cashFlowResult && Icon && (
        <div
          className={cn(
            'rounded-lg border p-3 transition-all',
            colorMap[cashFlowResult.status]
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="font-medium">
              Monthly {cashFlowResult.surplus >= 0 ? 'Surplus' : 'Deficit'}:{' '}
              {formatCurrency(Math.abs(cashFlowResult.surplus))}
            </span>
          </div>
          <p className="text-sm mt-1">
            Status: {getCashFlowLabel(cashFlowResult.status)}
          </p>
        </div>
      )}
    </div>
  );
}
