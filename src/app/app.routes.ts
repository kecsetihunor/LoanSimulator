import { Routes } from '@angular/router';
import { SimpleCalculatorComponent } from '@features/simple-calculator/simple-calculator.component';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'simple', 
    pathMatch: 'full' 
  },
  {
    path: 'simple',
    component: SimpleCalculatorComponent
  }
];
