import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from '../auth/user.entity'
import { CampusController } from './controllers/campus.controller'
import { MaintenanceController } from './controllers/maintenance.controller'
import { ReservationController } from './controllers/reservation.controller'
import { BuildingEntity } from './entities/building.entity'
import { MaintenanceReportEntity } from './entities/maintenance-report.entity'
import { ReservationEntity } from './entities/reservation.entity'
import { RoomEntity } from './entities/room.entity'
import { SportsFacilityEntity } from './entities/sports-facility.entity'
import { CampusService } from './services/campus.service'
import { MaintenanceService } from './services/maintenance.service'
import { ReservationService } from './services/reservation.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BuildingEntity,
      RoomEntity,
      SportsFacilityEntity,
      ReservationEntity,
      MaintenanceReportEntity,
      UserEntity,
    ]),
  ],
  controllers: [
    CampusController,
    ReservationController,
    MaintenanceController,
  ],
  providers: [
    CampusService,
    ReservationService,
    MaintenanceService,
  ],
  exports: [
    CampusService,
    ReservationService,
    MaintenanceService,
  ],
})
export class CampusModule {}
