import {Component, signal, ViewChild, ElementRef, AfterViewChecked} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {Machinery} from '../../../core/models/Machinery';
import {combineLatest, debounceTime, startWith} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {CurrencyPipe, NgForOf} from '@angular/common';
import {NavbarComponent} from '../../../shared/components/navbar/navbar.component';
import {MachineryService} from '../../../core/services/machinery.service';
import {Router} from '@angular/router';
import { streamFlow } from 'genkit/beta/client';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroUsers,
  heroChatBubbleBottomCenterText,
  heroPaperAirplane,
  heroBolt,
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-equipment-listing',
  imports: [
    ReactiveFormsModule,
    NgForOf,
    CurrencyPipe,
    NavbarComponent,
    NgIcon,
  ],
  templateUrl: './equipment-listing.component.html',
  styleUrl: './equipment-listing.component.css',
  viewProviders: [
    provideIcons({
      heroUsers,
      heroChatBubbleBottomCenterText,
      heroPaperAirplane,
      heroBolt,
    })
  ],
})
export class EquipmentListingComponent {

  private flowUrl = 'http://127.0.0.1:3400/agriRentalAssistantFlow';

  isChatOpen = signal(false);
  newMessage = signal('');
  chatMessages = signal<{content: string, sender: 'user' | 'bot', final?: boolean}[]>([]);

  @ViewChild('chatContainer') private chatContainer!: ElementRef<HTMLElement>;
  private previousMessageLength = 0;

  searchControl = new FormControl('');
  minPriceControl = new FormControl();
  maxPriceControl = new FormControl();
  typeFilter = signal<string>('');
  districtFilter = signal<string>('');

  // Filtered machinery
  filteredMachinery = signal<Machinery[]>([]);

  equipmentTypes = [
    'Tractor',
    'Harvester',
    'Cultivator',
    'Baler',
    'Seeder',
    'Sprayer',
    'Mower',
    'Treadle Pump'
  ];

  malawiDistricts = [
    // Northern Region
    'Chitipa',
    'Karonga',
    'Likoma',
    'Mzimba',
    'Nkhata Bay',
    'Rumphi',

    // Central Region
    'Dedza',
    'Dowa',
    'Kasungu',
    'Lilongwe',
    'Mchinji',
    'Nkhotakota',
    'Ntcheu',
    'Ntchisi',
    'Salima',

    // Southern Region
    'Balaka',
    'Blantyre',
    'Chikwawa',
    'Chiradzulu',
    'Machinga',
    'Mangochi',
    'Mwanza',
    'Neno',
    'Nsanje',
    'Thyolo',
    'Zomba'
  ];

  constructor(
    protected machineryService: MachineryService,
    private router: Router,
  ) {
    // initial filter manual trigger
    this.applyFilters(
      this.searchControl.value,
      this.minPriceControl.value,
      this.maxPriceControl.value,
      this.typeFilter(),
      this.districtFilter(),
      this.machineryService.machinery()
    );

    combineLatest([
      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        startWith(''),
      ),
      this.minPriceControl.valueChanges.pipe(startWith(null)),
      this.maxPriceControl.valueChanges.pipe(startWith(null)),
      toObservable(this.typeFilter),
      toObservable(this.districtFilter),
      toObservable(this.machineryService.machinery)
    ]).subscribe(([search, min, max, type, district, machinery]) => {
      this.applyFilters(search, min, max, type, district, machinery);
    });
  }

  ngAfterViewChecked() {
    if (this.chatMessages().length > this.previousMessageLength) {
      this.scrollToBottom();
      this.previousMessageLength = this.chatMessages().length;
    }
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop =
        this.chatContainer.nativeElement.scrollHeight;
    } catch(err) {
      console.error('Error scrolling:', err);
    }
  }

  private applyFilters(
    search: string | null,
    min: number | null,
    max: number | null,
    type: string,
    district: string,
    machinery: Machinery[]
  ) {
    this.filteredMachinery.set(
      machinery.filter(machine => {
        const searchMatch = !search ||
          machine.name.toLowerCase().includes(search.toLowerCase()) ||
          machine.description.toLowerCase().includes(search.toLowerCase());

        const typeMatch = !type || machine.type === type;

        const districtMatch = !district ||
          (machine.location && machine.location.toLowerCase().includes(district.toLowerCase()));

        const minPrice = min !== null ? Number(min) : null;
        const maxPrice = max !== null ? Number(max) : null;

        const priceMatch = (!minPrice || machine.pricePerDay >= minPrice) &&
          (!maxPrice || machine.pricePerDay <= maxPrice);

        return searchMatch && typeMatch && districtMatch && priceMatch;
      })
    );
  }

  filterType($event: any): void{
    this.typeFilter.set($event.target.value);
  }

  filterDistrict($event: any): void{
    this.districtFilter.set($event.target.value);
  }

  async viewMachineDetails(machinedId: string): Promise<void> {
    await this.router.navigate(['/equipment', machinedId]);
  }

  resetFilters() {
    this.searchControl.reset();
    this.minPriceControl.reset();
    this.maxPriceControl.reset();
    this.typeFilter.set('');
    this.districtFilter.set('');
  }

  async sendMessage() {
    if (!this.newMessage().trim()) return;

    // Add user message
    this.chatMessages.update(messages => [
      ...messages,
      { content: this.newMessage(), sender: 'user', final: true }
    ]);

    const loadingMessage = {
      content: '...',
      sender: 'bot' as const,
      final: false
    };
    this.chatMessages.update(messages => [...messages, loadingMessage]);

    try {
      // Get history (all final messages except the current user message)
      let history = this.chatMessages()
        .filter(m => m.final)
        .slice(0, -1); //

      if(history.length > 10){
        history = [];
      }

      const response = streamFlow({
        url: this.flowUrl,
        input: {
          query: this.newMessage(),
          machineryData: this.machineryService.machinery().map(m => ({
            name: m.name,
            type: m.type,
            pricePerDay: m.pricePerDay,
            location: m.location ? m.location : 'unknown',
          })),
          history: history,
        },
      });

      const contentOutput = await response.output;

      // Clear loading message and add full response
      this.chatMessages.update(messages => [
        ...messages.filter(m => m !== loadingMessage),
        {
          content: contentOutput, // Fixed here
          sender: 'bot',
          final: true
        }
      ]);

    } catch (error) {
      console.error('Chat error:', error);
      this.chatMessages.update(messages => [
        ...messages.filter(m => m !== loadingMessage),
        {
          content: 'Sorry, I encountered an error processing your request',
          sender: 'bot',
          final: true
        }
      ]);
    }

    this.newMessage.set('');
  }

  setNewMessage($event: any){
    this.newMessage.set($event.target.value)
  }

  testAI(){
    try{
      const response = streamFlow({
        url: this.flowUrl,
        input: 'cassava',
      });
    }catch(error: any){
      console.log('THERE WAS AN ERROR RUNNING AI FLOW', error);
    }
  }
}
