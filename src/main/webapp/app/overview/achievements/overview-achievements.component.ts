import { Component, Input, OnInit } from '@angular/core';
import { ILevel } from 'app/shared/model/level.model';
import { DimensionService } from 'app/entities/dimension';
import { IDimension } from 'app/shared/model/dimension.model';
import { HttpResponse } from '@angular/common/http';
import { IBadge } from 'app/shared/model/badge.model';
import { ITeam } from 'app/shared/model/team.model';
import { CompletionCheck } from 'app/shared/util/completion-check';
import { Router } from '@angular/router';

@Component({
    selector: 'jhi-overview-achievements',
    templateUrl: './overview-achievements.component.html',
    styleUrls: ['./overview-achievements.scss']
})
export class OverviewAchievementsComponent implements OnInit {
    @Input() teams: ITeam[];
    @Input() levels: ILevel[];
    @Input() badges: IBadge[];
    dimensions: IDimension[];
    generalBadges: IBadge[];
    activeBadgeId: number;
    activeLevelId: number;

    //activeDimensionId: number;

    constructor(private dimensionService: DimensionService, private router: Router) {}

    ngOnInit(): void {
        this.generalBadges = [];
        this.dimensionService.query().subscribe((res: HttpResponse<IDimension[]>) => {
            this.dimensions = res.body;
            const levelsByDimensionId = {};
            this.levels.forEach((level: ILevel) => {
                levelsByDimensionId[level.dimensionId] = levelsByDimensionId[level.dimensionId] || [];
                levelsByDimensionId[level.dimensionId].push(Object.assign(level));
            });

            const badgesByDimensionId = {};
            this.badges.forEach((badge: IBadge) => {
                if (badge.dimensions && badge.dimensions.length) {
                    badge.dimensions.forEach((dimension: IDimension) => {
                        badgesByDimensionId[dimension.id] = badgesByDimensionId[dimension.id] || [];
                        badgesByDimensionId[dimension.id].push(Object.assign(badge));
                    });
                } else {
                    this.generalBadges.push(Object.assign(badge));
                }
            });

            this.dimensions.forEach((dimension: IDimension) => {
                dimension.levels = levelsByDimensionId[dimension.id] || [];
                dimension.badges = badgesByDimensionId[dimension.id] || [];
            });
        });
    }

    getAchievementProgress(item: ILevel | IBadge) {
        let baseCount = 0;
        let completedCount = 0;
        this.teams.forEach((team: ITeam) => {
            if (this.isRelevant(team, item)) {
                baseCount++;
                if (this.isLevelOrBadgeCompleted(team, item)) {
                    completedCount++;
                }
            }
        });
        return baseCount === 0 ? 0 : completedCount / baseCount * 100;
    }

    private isLevelOrBadgeCompleted(team: ITeam, item: ILevel | IBadge): boolean {
        return new CompletionCheck(team, item).isCompleted();
    }

    private isRelevant(team: ITeam, item: ILevel | IBadge) {
        if ((<ILevel>item).dimensionId) {
            return this.isLevelRelevant(team, item);
        }
        return this.isBadgeRelevant(team, item);
    }

    private isLevelRelevant(team: ITeam, level: ILevel) {
        if (!team.participations.length) {
            return false;
        }
        return team.participations.some((dimension: IDimension) => dimension.id === level.dimensionId);
    }

    private isBadgeRelevant(team: ITeam, badge: IBadge) {
        if (!badge.dimensions || !badge.dimensions.length) {
            return true;
        }
        if (!team.participations.length) {
            return false;
        }
        const badgeDimensionIds = badge.dimensions.map((badgeDim: IDimension) => badgeDim.id);
        return team.participations.some((dimension: IDimension) => badgeDimensionIds.indexOf(dimension.id) !== -1);
    }

    selectBadge(badge: IBadge) {
        this.activeLevelId = null;
        // this.activeDimensionId = null;
        if (this.activeBadgeId === badge.id) {
            this.activeBadgeId = null;
            this.router.navigate(['.']);
        } else {
            this.activeBadgeId = badge.id;
            this.router.navigate(['.'], { queryParams: { badge: this.activeBadgeId } });
        }
    }

    selectLevel(level: ILevel) {
        this.activeBadgeId = null;
        // this.activeDimensionId = null;
        if (this.activeLevelId === level.id) {
            this.activeLevelId = null;
            this.router.navigate(['.']);
        } else {
            this.activeLevelId = level.id;
            this.router.navigate(['.'], { queryParams: { level: this.activeLevelId } });
        }
    }

    /*selectDimension(dimension: IDimension) {
        this.activeBadgeId = null;
        this.activeLevelId = null;
        if (this.activeDimensionId === dimension.id) {
            this.activeLevelId = null;
        } else {
            this.activeDimensionId = dimension.id;
        }
    }*/
}
