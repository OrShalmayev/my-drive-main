import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {map, Observable, tap} from 'rxjs';
import {AsyncPipe, NgForOf, NgIf} from '@angular/common';
import {DriveComponent} from './components/drive/drive.component';
import {NavComponent} from './components/nav/nav.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgForOf, AsyncPipe, NgIf, DriveComponent, NavComponent],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.scss'
})
export class AppComponent {
}
