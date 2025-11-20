import { Component, Input, Output, EventEmitter, inject, OnInit  } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { LoanCalculatorService, RepaymentType  } from '@core/services/loan-calculator.service';
import { PaymentScheduleRow } from '@app/shared/models/loan.models';
import { MatButtonToggleModule  } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { LoanInputComponent } from '@app/features/simple-calculator/components/loan-input/loan-input.component';
import { AdvancedLoanInputComponent} from '@app/features/advanced-calculator/components/advanced-loan-input/advanced-loan-input.component'
import { AmortizationScheduleComponent } from '@app/shared/components/amortization-schedule/amortization-schedule.component';
import { PaymentSummaryCardsComponent } from '@app/shared/components/payment-summary-cards/payment-summary-cards.component';
import { LoanDataService } from '@core/services/loan-data.service';
import { take } from 'rxjs';

type ScenarioMode = 'simple' | 'advanced';
type LoanType = 'annuity' | 'linear';

@Component({
  selector: 'app-repayment-calculator',
  standalone: true,
  imports: [MatButtonToggleModule, CommonModule, FormsModule, LoanInputComponent, AdvancedLoanInputComponent, AmortizationScheduleComponent, PaymentSummaryCardsComponent ],
  templateUrl: './repayment-calculator.component.html',
  styleUrl: './repayment-calculator.component.css'
})

export class RepaymentCalculatorComponent implements OnInit {
  // UI state
  mode: ScenarioMode = 'simple';
  loanType: LoanType = 'annuity';
  private loanDataService = inject(LoanDataService);

  @Input() amount: number | null = null;
  @Output() amountChange = new EventEmitter<number | null>();
  
  @Input() totalPeriod: number |null = null;
  @Output() totalPeriodChange = new EventEmitter<number | null>();
 
  @Input() fixedMonths: number | null = null;  // First 3 years
  @Output() fixedMonthsChange = new EventEmitter<number | null>();
 
  @Input() fixedRate: number | null = null;  // Fixed rate for first period
  @Output() fixedRateChange = new EventEmitter<number | null>();

  @Input() insuranceRate: number | null = null;  // Insurance rate
  @Output() insuranceRateChange = new EventEmitter<number | null>();
 
  @Input() variableRate: number | null = null;  // Variable rate after fixed period
  @Output() variableRateChange = new EventEmitter<number | null>();

  @Output() inputChanged = new EventEmitter<{ amount: number | null; totalPeriod: number | null; fixedMonths: number | null; fixedRate: number | null; variableRate: number | null, insuranceRate: number | null }>();

  // Scenario output
  scenarioSchedule: PaymentScheduleRow[] = [];
  scenarioTotal = 0;
  scenarioFirstPayment = 0;

  constructor(private loanService: LoanCalculatorService) {}

  ngOnInit(): void {
    this.loanDataService.currentLoanData.pipe(take(1)).subscribe(data => {
      if (data) {
        // Pre-fill the component's state from the service
        this.amount = data.amount;
        this.totalPeriod = data.period;
        this.fixedRate = data.rate;
        this.variableRate = data.variableRate;
        this.fixedMonths = data.fixedPeriod;
        if (data.insuranceRate !== null) {
          this.insuranceRate = data.insuranceRate;
        }
      }
    });
  }

  // === Input handlers from child components ===

  // from <app-loan-input>
  onSimpleInputChanged(data: { amount: number | null; period: number | null; rate: number | null, insuranceRate: number | null }) {
    this.amount = data.amount;
    this.totalPeriod = data.period;
    this.fixedRate = data.rate;
    this.insuranceRate = data.insuranceRate;
    this.loanDataService.updateLoanData(data)

    this.recalculateScenario();
  }

  // from <app-advanced-loan-input>
  onAdvancedInputChanged(data: { amount: number | null; totalPeriod: number | null; fixedMonths: number | null, fixedRate: number | null, variableRate: number | null, insuranceRate: number | null }) {
    this.amount = data.amount;
    this.fixedMonths = data.fixedMonths;
    this.fixedRate = data.fixedRate;
    this.variableRate = data.variableRate;
    this.totalPeriod = data.totalPeriod;
    this.insuranceRate = data.insuranceRate;
    
    // Map the advanced calculator data to the shared LoanData interface
    this.loanDataService.updateLoanData({
      amount: data.amount,
      period: data.totalPeriod, // Map totalPeriod to period
      rate: data.fixedRate,      // Map fixedRate to rate
      fixedPeriod: data.fixedMonths,
      variableRate: data.variableRate,
      insuranceRate: data.insuranceRate
    });
    
    this.recalculateScenario();
  }

  // called by toggles in template when switching simple/advanced or annuity/linear
  onModeChanged(mode: ScenarioMode) {
    this.mode = mode;
    this.recalculateScenario();
  }

  onLoanTypeChanged(type: LoanType) {
    this.loanType = type;
    this.recalculateScenario();
  }

  // === Core scenario calculation ===

  private recalculateScenario(): void {
    // Basic guard – avoid NaN / useless schedules
    if (!this.isValid()) {
      this.clearScenario();
      return;
    }

    if (this.mode === 'simple') {
      this.calculateSimpleScenario();
    } else {
      this.calculateAdvancedScenario();
    }
  }

  private calculateSimpleScenario(): void {
    let schedule: PaymentScheduleRow[] = [];

    // Use your existing generateAmortizationSchedule with type flag
    const type: RepaymentType = this.loanType === 'annuity' ? 'annuity' : 'linear';
    schedule = this.loanService.generateAmortizationSchedule(
      this.amount!,
      this.totalPeriod!,
      this.fixedRate!,
      this.insuranceRate,
      type
    );

    this.setScenarioFromSchedule(schedule);
  }

  private calculateAdvancedScenario(): void {

    let schedule: PaymentScheduleRow[] = [];

    if (this.loanType === 'annuity') {
      // Use your generateVariableAnnuitySchedule
      schedule = this.loanService.generateVariableAnnuitySchedule(
        this.amount!,
        this.totalPeriod!,
        this.fixedRate!,
        this.fixedMonths!,
        this.variableRate!,
        this.insuranceRate
      );
    } else {
      // Use your generateVariableLinearSchedule
      schedule = this.loanService.generateVariableLinearSchedule(
        this.amount!,
        this.totalPeriod!,
        this.fixedRate!,
        this.fixedMonths!,
        this.variableRate!,
        this.insuranceRate
      );
    }

    this.setScenarioFromSchedule(schedule); 
  }

  // === Helpers ===

  private setScenarioFromSchedule(schedule: PaymentScheduleRow[]): void {
    this.scenarioSchedule = schedule;

    if (!schedule.length) {
      this.scenarioTotal = 0;
      this.scenarioFirstPayment = 0;
      return;
    }

    this.scenarioFirstPayment = schedule[0].payment;
    this.scenarioTotal = schedule.reduce((sum, row) => sum + row.payment, 0);
  }

  private clearScenario(): void {
    this.scenarioSchedule = [];
    this.scenarioTotal = 0;
    this.scenarioFirstPayment = 0;
  }

  // You can wire this to your existing PDF export
  downloadScenarioPdf(): void {
    // e.g. reuse existing method or dedicated PdfService
    // this.pdfService.download(this.scenarioSchedule, this.loanType, this.mode);
  }

  
  isValid(): boolean {
    if (this.mode === 'simple') {
      return this.amount !== null && 
           this.amount > 0 && 
           this.totalPeriod !== null && 
           this.totalPeriod > 0 && 
           this.fixedRate !== null && 
           this.fixedRate >= 0;
    } else {
      return this.amount !== null && 
           this.amount > 0 && 
           this.totalPeriod !== null &&
           this.totalPeriod! > 0 && 
           this.fixedMonths !== null &&
           this.fixedMonths! > 0 &&
           this.fixedMonths! <= this.totalPeriod! &&
           this.fixedRate !== null &&
           this.fixedRate! >= 0 &&
           this.variableRate !== null &&
           this.variableRate! >= 0;
    }
  }
}
