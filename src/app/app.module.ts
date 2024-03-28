import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {AppComponent} from './app.component';
import {NZ_I18N} from 'ng-zorro-antd/i18n';
import {en_US} from 'ng-zorro-antd/i18n';
import {registerLocaleData} from '@angular/common';
import en from '@angular/common/locales/en';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {CustomNodeComponent} from './custom-node/custom-node.component';
import {NgxPopperjsModule} from 'ngx-popperjs';
import {NzBadgeModule} from 'ng-zorro-antd/badge';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzDividerModule} from 'ng-zorro-antd/divider';

registerLocaleData(en);

@NgModule({
    declarations: [AppComponent, CustomNodeComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        NzButtonModule,
        NgxPopperjsModule,
        NzBadgeModule,
        NzIconModule,
        NzDividerModule,
    ],
    providers: [{provide: NZ_I18N, useValue: en_US}],
    bootstrap: [AppComponent],
})
export class AppModule {}
