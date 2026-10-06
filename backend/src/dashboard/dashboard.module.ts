import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ReportsModule } from '../reports/reports.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { SavingsGoalsModule } from '../savings-goals/savings-goals.module';
import { PredictionsModule } from '../predictions/predictions.module';

@Module({
  imports: [ReportsModule, BudgetsModule, SavingsGoalsModule, PredictionsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
