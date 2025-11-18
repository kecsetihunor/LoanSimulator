import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoanData } from '@shared/models/loan.models';

@Injectable({
  providedIn: 'root'
})

export class LoanDataService {
  private loanDataSource = new BehaviorSubject<LoanData>({
    amount: null,
    period: null,
    rate: null,
    insuranceRate: null,
    fixedPeriod: null,
    variableRate: null  
  });

  currentLoanData = this.loanDataSource.asObservable();

  updateLoanData(data: Partial<LoanData>) {
    this.loanDataSource.next({ ...this.loanDataSource.value, ...data });
  }
}
