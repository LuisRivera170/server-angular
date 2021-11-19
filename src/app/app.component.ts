import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, startWith, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { DataState } from './enum/data-state.enum';
import { Status } from './enum/status.enum';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { Server } from './interface/server';
import { ServerService } from './service/server.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  appState$: Observable<AppState<CustomResponse>>;
  filterSubject = new BehaviorSubject<string>('');
  private dataSubject = new BehaviorSubject<CustomResponse | null>(null);
  filterStatus$ = this.filterSubject.asObservable();
  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  readonly DataState = DataState;
  readonly Status = Status;
  readonly apiUrl = environment.apiUrl;

  constructor(private serverService: ServerService) {
    this.appState$ = this.serverService.servers$
      .pipe(
        map(response => {
          this.dataSubject.next(response);
          return { dataState: DataState.LOADED_STATE, appData: response }
        }),
        startWith({ dataState: DataState.LOADING_STATE }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error })
        })
      );
  }

  ngOnInit(): void { }

  pingServer(ipAddress: string): void {
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress)
      .pipe(
        map(response => {
          this.filterSubject.next('');
          if (this.dataSubject.value?.data.servers && response.data.server) {
            const servers = [...this.dataSubject.value?.data.servers];
            const index = servers.findIndex(server => server.id === response.data.server!.id);
            servers[index] = response.data.server;
            this.dataSubject.value.data.servers = [...servers];
            return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value! }
          } else {
            return { dataState: DataState.ERROR_STATE, error: 'pinging server Error'}
          }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value! }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error })
        })
      );
  }

  filterServers(status: Status): void {
    this.appState$ = this.serverService.filter$(status, this.dataSubject.value!)
      .pipe(
        map(response => { return {dataState: DataState.LOADED_STATE, appData: response} }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value! }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error })
        })
      );
  }

  saveServer(serverForm: NgForm): void {
    this.isLoading.next(true);
    this.appState$ = this.serverService.save$(serverForm.value)
      .pipe(
        map(response => {
          this.dataSubject.next(
            {...response, data: {
              servers: [response.data.server!, ...this.dataSubject.value?.data.servers!]
            }}
          );
          document.getElementById('closeModal')?.click();
          serverForm.resetForm({ status: this.Status.SERVER_DOWN });
          this.isLoading.next(false);
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value! }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value! }),
        catchError((error: string) => {
          this.isLoading.next(false);
          return of({ dataState: DataState.ERROR_STATE, error })
        })
      );
  }

  deleteServer(server: Server) {
    this.appState$ = this.serverService.delete$(server.id)
      .pipe(
        map(response => {
          this.dataSubject.next({
            ...response,
            data: {
              servers: this.dataSubject.value?.data.servers?.filter(serverItem => serverItem.id !== server.id)
            }
          });
          
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value! }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value! }),
        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error })
        })
      );
  }

}
