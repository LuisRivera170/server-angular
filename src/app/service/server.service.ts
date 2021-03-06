import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CustomResponse } from '../interface/custom-response';
import { Observable, Subscriber, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Server } from '../interface/server';
import { Status } from '../enum/status.enum';

@Injectable({
  providedIn: 'root'
})
export class ServerService {

  constructor(private http: HttpClient) { }

  servers$ = <Observable<CustomResponse>>
    this.http
      .get<CustomResponse>(`${environment.apiUrl}/server/list`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  save$ = (server: Server) => <Observable<CustomResponse>>
    this.http
      .post<CustomResponse>(`${environment.apiUrl}/server/save`, server)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  ping$ = (ipAddress: string) => <Observable<CustomResponse>>
    this.http
      .get<CustomResponse>(`${environment.apiUrl}/server/ping/${ipAddress}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  delete$ = (serverId: number) => <Observable<CustomResponse>>
    this.http
      .delete<CustomResponse>(`${environment.apiUrl}/server/delete/${serverId}`)
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );

  filter$ = (status: Status, response: CustomResponse) => <Observable<CustomResponse>>
    new Observable<CustomResponse>(
      suscriber => {
        console.log(response);
        suscriber.next(
          status == Status.ALL ? {
            ...response,
            message: `Servers filtered by ${status} status`
          } : {
            ...response,
            message: response.data.servers && response.data.servers.filter(server => server.status === status).length > 0 ?
              `Servers filtered by ${status == Status.SERVER_UP ? 'SERVER_UP' : 'SERVERDOWN'} status` :
              `No server of ${status} found`,
            data: { servers: response.data.servers && response.data.servers.filter(server => server.status === status) }
          }
        );
        suscriber.complete();
      }
    )
      .pipe(
        tap(console.log),
        catchError(this.handleError)
      );


  private handleError(error: HttpErrorResponse): Observable<never> {
    console.log(error);
    return throwError(`An error occurred - Error code ${error.status}`);
  }

}
