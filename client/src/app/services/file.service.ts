import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ServerResponse} from '../models/file.model';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  apiUrl = 'http://localhost:4002';

  constructor(private http: HttpClient) {}

  getAllFiles(): Observable<ServerResponse> {
    return this.http.get<ServerResponse>(`${this.apiUrl}/all`);
  }

  uploadFiles(files: File[], currentPath: string[] = []): Observable<any> {
    const formData = new FormData();
    formData.append('path', currentPath.join('/'));
    files.forEach(file => {
      formData.append('files', file);
    });
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  createFolder(name: string, currentPath: string[]): Observable<any> {
    const path = [...currentPath, name].join('/');
    return this.http.post(`${this.apiUrl}/createFolder`, { path });
  }

  downloadFolder(path: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download-folder`, {
      params: { path },
      responseType: 'blob'
    });
  }
}
