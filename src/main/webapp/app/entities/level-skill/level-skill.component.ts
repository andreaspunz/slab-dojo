import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { JhiEventManager, JhiAlertService } from 'ng-jhipster';

import { ILevelSkill } from 'app/shared/model/level-skill.model';
import { AccountService } from 'app/core';
import { LevelSkillService } from './level-skill.service';

@Component({
    selector: 'jhi-level-skill',
    templateUrl: './level-skill.component.html'
})
export class LevelSkillComponent implements OnInit, OnDestroy {
    levelSkills: ILevelSkill[];
    currentAccount: any;
    eventSubscriber: Subscription;

    constructor(
        protected levelSkillService: LevelSkillService,
        protected jhiAlertService: JhiAlertService,
        protected eventManager: JhiEventManager,
        protected accountService: AccountService
    ) {}

    loadAll() {
        this.levelSkillService.query().subscribe(
            (res: HttpResponse<ILevelSkill[]>) => {
                this.levelSkills = res.body;
            },
            (res: HttpErrorResponse) => this.onError(res.message)
        );
    }

    ngOnInit() {
        this.loadAll();
        this.accountService.identity().then(account => {
            this.currentAccount = account;
        });
        this.registerChangeInLevelSkills();
    }

    ngOnDestroy() {
        this.eventManager.destroy(this.eventSubscriber);
    }

    trackId(index: number, item: ILevelSkill) {
        return item.id;
    }

    registerChangeInLevelSkills() {
        this.eventSubscriber = this.eventManager.subscribe('levelSkillListModification', response => this.loadAll());
    }

    protected onError(errorMessage: string) {
        this.jhiAlertService.error(errorMessage, null, null);
    }
}
