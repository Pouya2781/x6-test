import {AfterViewInit, Component, Injector} from '@angular/core';
import {Graph} from '@antv/x6';
import {register} from '@antv/x6-angular-shape';
import {AccountType, CustomNodeComponent} from './custom-node/custom-node.component';
import {NgxPopperjsPlacements, NgxPopperjsTriggers} from 'ngx-popperjs';
import {Snapline} from '@antv/x6-plugin-snapline';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
    constructor(private injector: Injector) {}
    ngAfterViewInit() {
        const graph = new Graph({
            container: document.getElementById('container') as HTMLElement,
            width: 1000,
            height: 600,
            background: {
                color: '#F2F7FA',
            },
            grid: true,
        });

        graph.use(
            new Snapline({
                enabled: true,
            })
        );

        register({
            shape: 'custom-angular-component-node',
            width: 270,
            height: 100,
            content: CustomNodeComponent,
            injector: this.injector,
        });

        let node1 = graph.addNode({
            shape: 'custom-angular-component-node',
            x: 100,
            y: 100,
            data: {
                ngArguments: {
                    ownerName: 'افسر',
                    ownerFamilyName: 'طباطبایی',
                    accountID: '6534454617',
                    branchName: 'گلوبندک',
                    accountType: AccountType.SAVINGS,
                    transactionCount: 196,
                },
            },
        });
        let node2 = graph.addNode({
            shape: 'custom-angular-component-node',
            x: 250,
            y: 250,
            data: {
                //Input parameters must be placed here
                ngArguments: {
                    ownerName: 'شیرین',
                    ownerFamilyName: 'براهیم نژاد',
                    accountID: '6039548046',
                    branchName: 'خواجه عبدالله انصاری',
                    accountType: AccountType.CURRENT,
                    transactionCount: 8,
                },
            },
        });
        graph.addEdge({
            shape: 'edge',
            source: node1,
            target: node2,
            router: {
                name: 'normal',
                args: {},
            },
            connector: {
                name: 'smooth',
                args: {},
            },
        });
        graph.addEdge({
            shape: 'edge',
            source: node1,
            target: node2,
            router: {
                name: 'normal',
                args: {},
            },
            connector: {
                name: 'smooth',
                args: {},
            },
        });
        node1.zIndex = 1000;
        node2.zIndex = 1000;
        console.log(node1.getSize());
    }

    protected readonly NgxPopperjsTriggers = NgxPopperjsTriggers;
    protected readonly NgxPopperjsPlacements = NgxPopperjsPlacements;
}
