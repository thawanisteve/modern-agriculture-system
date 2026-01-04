import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import {provideHttpClient} from '@angular/common/http';
import { GALLERY_CONFIG, GalleryConfig } from 'ng-gallery';
import {provideAnimations} from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: GALLERY_CONFIG,
      useValue: {
        autoHeight: true,
        imageSize: 'cover'
      } as GalleryConfig
    },
    provideAnimations(),
    provideHttpClient(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp(
        { projectId: "agrirental-f7e17",
          appId: "1:222542928399:web:b164ed0c8d435a2c04617a",
          storageBucket: "agrirental-f7e17.firebasestorage.app",
          apiKey: "AIzaSyDLDpZUk6Io_vNHgIa4Fz-YsnGRuvD9MwY",
          authDomain: "agrirental-f7e17.firebaseapp.com",
          messagingSenderId: "222542928399",
          measurementId: "G-RE30CNE322" }
      )
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
  ]
};
