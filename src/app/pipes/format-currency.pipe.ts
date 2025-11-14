import { Pipe, PipeTransform, Inject, LOCALE_ID } from '@angular/core';
import { CurrencyService } from '@core/services/currency.service';

@Pipe({
  name: 'formatCurrency',
  standalone: true,
  pure: false
})
export class FormatCurrencyPipe implements PipeTransform {
  currentLocale: string;
  
  constructor(
    @Inject(LOCALE_ID) locale: string,
    private currencyService: CurrencyService
    ) {
      this.currentLocale = locale;
    }

transform(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    const currency = this.currencyService.getSelectedCurrency();
    
    // Use toLocaleString with 'en-US' locale for comma thousands separator
    const formattedValue = value.toLocaleString(this.currentLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return `${formattedValue} ${currency.symbol}`;
  }
}
