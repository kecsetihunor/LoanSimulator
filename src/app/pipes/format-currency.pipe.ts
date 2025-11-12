import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyService } from '@core/services/currency.service';

@Pipe({
  name: 'formatCurrency',
  standalone: true,
  pure: false
})
export class FormatCurrencyPipe implements PipeTransform {
  constructor(private currencyService: CurrencyService) {}

  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    const currency = this.currencyService.getSelectedCurrency();
    return `${value.toFixed(2)} ${currency.symbol}`;
  }
}
