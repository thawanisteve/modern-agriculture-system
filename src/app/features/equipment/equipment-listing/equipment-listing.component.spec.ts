import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipmentListingComponent } from './equipment-listing.component';

describe('EquipmentListingComponent', () => {
  let component: EquipmentListingComponent;
  let fixture: ComponentFixture<EquipmentListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentListingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipmentListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
