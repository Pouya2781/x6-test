import {AfterViewInit, Component, Injector} from '@angular/core';
import {Graph} from '@antv/x6';
import {register} from '@antv/x6-angular-shape';
import {AccountType, CustomNodeComponent, NodeState} from './custom-node/custom-node.component';
import {NgxPopperjsPlacements, NgxPopperjsTriggers} from 'ngx-popperjs';
import {Snapline} from '@antv/x6-plugin-snapline';
import {CustomNodeService} from './services/custom-node.service';
import {BankGraph} from './models/bank-graph';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
    private graph!: BankGraph;
    constructor(
        private injector: Injector,
        private customNodeService: CustomNodeService
    ) {
        this.customNodeService.nodeListener.subscribe((value) => {
            const targetNode = this.graph.getNode(value.nodeId);

            targetNode?.resize(value.width, value.height);
        });
    }
    ngAfterViewInit() {
        this.graph = new BankGraph({
            container: document.getElementById('container') as HTMLElement,
            /* width: 1000,
            height: 600, */
            background: {
                color: '#F2F7FA',
            },
            grid: true,
        });

        this.graph.use(
            new Snapline({
                enabled: true,
            })
        );

        register({
            shape: 'custom-angular-component-node',
            content: CustomNodeComponent,
            injector: this.injector,
        });

        let node1 = this.graph.addCustomNode({
            shape: 'custom-angular-component-node',
            id: '1',
            x: 100,
            y: 100,
            data: {
                ngArguments: {
                    nodeId: '1',
                    ownerName: 'افسر',
                    ownerFamilyName: 'طباطبایی',
                    accountID: '6534454617',
                    branchName: 'گلوبندک',
                    branchAddress: 'تهران-خیابان خیام-بالاتر از چهارراه گلوبندک',
                    branchTelephone: '55638667',
                    sheba: 'IR120778801496000000198',
                    cardID: '6104335000000190',
                    accountType: AccountType.SAVINGS,
                    transactionCount: 196,
                },
            },
        });
        let node2 = this.graph.addCustomNode({
            shape: 'custom-angular-component-node',
            id: '2',
            x: 250,
            y: 250,
            data: {
                //Input parameters must be placed here
                ngArguments: {
                    nodeId: '2',
                    ownerName: 'شیرین',
                    ownerFamilyName: 'ابراهیم نژاد',
                    accountID: '6039548046',
                    branchName: 'خواجه عبدالله انصاری',
                    branchAddress: 'تهران-خیابان خواجه عبدالله انصاری-نبش کوچه ششم-پلاک 110',
                    branchTelephone: '22844370',
                    sheba: 'IR500379357299000000405',
                    cardID: '6395995000000400',
                    accountType: AccountType.CURRENT,
                    transactionCount: 8,
                },
            },
        });
        this.graph.addEdge({
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
    }
}
