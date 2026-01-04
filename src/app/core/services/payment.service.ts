import { Injectable } from '@angular/core';
import { LevelSDK, generateTxRef } from 'paychangu-js';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor() { }

  private levelConfig = {
    public_key: 'pub-test-X8yApUly5TxRBzLjhSlikbazNAuzolSy',
    amount: 1000,
    currency: 'MWK',
    email: 'happybanda@dyuni.ac.mw',
    first_name: 'Happy',
    last_name: 'Banda',
    callback_url: 'http://localhost:4200/equipment',
    return_url: 'http://localhost:4200/equipment',
    tx_ref: generateTxRef()
  };


  async initializePayment(): Promise<void>{
    LevelSDK.setSecretKey('pub-test-X8yApUly5TxRBzLjhSlikbazNAuzolSy');
    const response = await LevelSDK.initiateTransaction(this.levelConfig);
    console.log('PAYMENT RESPONSE', response);
  }
}
