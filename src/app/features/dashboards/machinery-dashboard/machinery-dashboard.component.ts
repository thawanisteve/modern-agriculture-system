import {Component, effect, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {NavbarComponent} from '../../../shared/components/navbar/navbar.component';
import {CurrencyPipe, TitleCasePipe} from '@angular/common';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MachineryService} from '../../../core/services/machinery.service';
import {Machinery} from '../../../core/models/Machinery';
import {AuthService} from '../../../core/services/auth.service';
import {User} from '@angular/fire/auth';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-machinery-dashboard',
  imports: [
    NavbarComponent,
    TitleCasePipe,
    CurrencyPipe,
    ReactiveFormsModule
  ],
  templateUrl: './machinery-dashboard.component.html',
  styleUrl: './machinery-dashboard.component.css'
})
export class MachineryDashboardComponent implements OnInit, OnDestroy {
  machineryService = inject(MachineryService);
  machinery = this.machineryService.machinery;
  authService = inject(AuthService);
  currentUser: User | null = null;
  equipmentTypes = ['Tractor', 'Harvester', 'Cultivator', 'Baler', 'Seeder', 'Sprayer', 'Mower', 'Waterpump', 'Plower', 'Ridger'];


  maxImages = 8;
  selectedFiles = signal<File[]>([]);
  imagePreviews = signal<string[]>([]);

  showModal = signal<boolean>(false);
  editingMachine = signal<Machinery | null>(null);

  machineForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    type: new FormControl('', [Validators.required]),
    pricePerDay: new FormControl(0, [Validators.required, Validators.min(1)]),
    location: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    status: new FormControl('available', [Validators.required]),
    images: new FormControl<string[]>([], [Validators.maxLength(this.maxImages)])
  });

  stats = signal({
    total: 0,
    available: 0,
    revenue: 0
  });

  constructor() {
    effect(() => {
      const machines = this.machinery();
      this.stats.set({
        total: machines.length,
        available: machines.filter(m => m.status === 'available').length,
        revenue: machines.reduce((sum, m) => sum + (m.pricePerDay), 0)
      });
    });
  }

  ngOnInit() {
    this.authService.getCurrentUser().subscribe((user: User | null) => {
      this.currentUser = user;
    });
  }

  ngOnDestroy() {

  }

  openAddModal() {
    this.editingMachine.set(null);
    this.machineForm.reset({ status: 'available' });
    this.showModal.set(true);
  }

  editMachine(machine: Machinery) {
    this.editingMachine.set(machine);
    this.machineForm.patchValue(machine);
    this.imagePreviews.set(machine.images || []);
    this.showModal.set(true);
  }

  async deleteMachine(id: string) {
    if (confirm('Are you sure you want to delete this machinery?')) {
      await this.machineryService.deleteMachinery(id);
    }
  }

  closeModal() {
    this.showModal.set(false);
    this.machineForm.reset();
    this.selectedFiles.set([]);
    this.imagePreviews.set([]);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];

    if (files.length + this.selectedFiles().length > this.maxImages) {
      alert(`Maximum ${this.maxImages} images allowed`);
      return;
    }

    this.selectedFiles.update(current => [...current, ...files]);

    // Generate previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviews.update(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
    this.imagePreviews.update(previews => previews.filter((_, i) => i !== index));
  }

  async handleSubmit() {
    if (this.machineForm.invalid) return;

    // Convert images to base64
    const images = await Promise.all(
      this.selectedFiles().map(file => this.convertToBase64(file))
    );

    const formData = {
      ...this.machineForm.value,
      images: [...(this.machineForm.value.images || []), ...images]
    };

    if (this.editingMachine()) {
      await this.machineryService.updateMachinery(
        this.editingMachine()!.id,
        formData as Partial<Machinery>
      );
    } else {
      await this.machineryService.addMachinery(formData as Omit<Machinery, 'id'>);
    }

    this.closeModal();
  }

  private convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}
