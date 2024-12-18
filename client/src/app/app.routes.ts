import { Routes } from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {DriveComponent} from './components/drive/drive.component';

export const routes: Routes =[
  { path: '', component: HomeComponent },
  { path: 'drive', component: DriveComponent },
  { path: '**', redirectTo: '' }  // Redirect invalid routes to home
];
