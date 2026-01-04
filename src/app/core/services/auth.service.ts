import {inject, Injectable} from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword, signInWithPopup, signOut, User, user
} from '@angular/fire/auth';
import {doc, Firestore, setDoc} from '@angular/fire/firestore';
import {BehaviorSubject, Observable} from 'rxjs';
import {emailVerified} from '@angular/fire/auth-guard';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private _user$: Observable<User | null> = user(this.auth);
  private _loading$ = new BehaviorSubject<boolean>(false);
  public loading$ = this._loading$.asObservable();
  public _error$ = new BehaviorSubject<string | null>(null);
  public error$ = this._error$.asObservable();

  constructor(
    private firestore: Firestore,
    private router: Router,
  ) { }

  async signUp(email: string, password: string, displayName: string, phoneNumber: string, nationalId: string): Promise<void>{
    this._loading$.next(true);
    this._error$.next(null);
    try{
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // send email verification
      await sendEmailVerification(user);
      // save the user in firestore
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userDocRef, {
        email: user.email,
        displayName: displayName,
        phoneNumber: phoneNumber,
        nationalId: nationalId,
        emailVerified: user.emailVerified
      });
    }catch(error: any){
      this._error$.next(this.handleFirebaseError(error.code));
      throw error;
    }finally {
      this._loading$.next(false);
    }
  }

  async signIn(email: string, password: string): Promise<void>{
    this._loading$.next(true);
    this._error$.next(null);
    try{
      const userRef = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userRef.user;
      if(user === null) return;

      if(user.email === 'supplier@gmail.com') {
        await this.router.navigate(['machinery-dashboard']);
        return;
      }

      else if(user.email === 'admin@gmail.com') {
        await this.router.navigate(['admin-dashboard']);
        return;
      }

      else{
        await this.router.navigate(['equipment']);
        return;
      }

    }catch(error: any){
      this._error$.next(this.handleFirebaseError(error.code));
      throw error;
    }finally {
      this._loading$.next(false);
    }
  }

  async signInWithGoogle(): Promise<void>{
    this._loading$.next(true);
    this._error$.next(null);
    try{
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(this.auth, provider);
      const user = userCredential.user;

      // save user to firestore
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userDocRef, {
        email: user.email,
        displayName: user.displayName,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
      });
    }catch(error: any){
      this._error$.next(this.handleFirebaseError(error.code));
      throw error;
    }finally {
      this._loading$.next(false);
    }
  }

  async signOut(): Promise<void>{
    this._loading$.next(true);
    this._error$.next(null);
    try{
      await signOut(this.auth);
    }catch(error: any){
      this._error$.next(this.handleFirebaseError(error.code));
      throw error;
    }
  }

  async resendEmailVerification(): Promise<void>{
    this._loading$.next(true);
    this._error$.next(null);
    try{
      const user = this.auth.currentUser;
      if(!user){
        throw new Error('No authenticated user found');
      }
      await sendEmailVerification(user);
    }catch(error: any){
      this._error$.next(this.handleFirebaseError(error.code));
      throw error;
    }finally {
      this._loading$.next(false);
    }
  }

  getCurrentUser(): Observable<User | null>{
    return this._user$;
  }

  private handleFirebaseError(errorCode: string): string {
    switch (errorCode) {
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/user-disabled':
        return 'This user has been disabled.';
      case 'auth/user-not-found':
        return 'User not found. Please check your email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'Email address is already in use.';
      case 'auth/operation-not-allowed':
        return 'Operation not allowed.';
      case 'auth/weak-password':
        return 'Password is too weak.  It must be at least 6 characters.';
      case 'auth/popup-closed-by-user':
        return 'The popup was closed by the user';
      case 'auth/popup-blocked':
        return 'The popup was blocked by the browser';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

}
