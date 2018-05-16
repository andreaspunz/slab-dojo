import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ITeam } from 'app/shared/model/team.model';
import { ISkill } from 'app/shared/model/skill.model';
import { TeamSkillService } from 'app/entities/team-skill';
import { TeamsService } from 'app/teams/teams.service';
import { IBadge } from 'app/shared/model/badge.model';
import { ILevel } from 'app/shared/model/level.model';
import { LevelService } from 'app/entities/level';
import { BadgeService } from 'app/entities/badge';
import moment = require('moment');
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { AchievableSkill, IAchievableSkill } from 'app/shared/model/achievable-skill.model';
import { TeamsSkillsService } from 'app/teams/teams-skills.service';
import { ITeamSkill } from 'app/shared/model/team-skill.model';

@Component({
    selector: 'jhi-skill-details',
    templateUrl: './skill-details.component.html',
    styleUrls: ['./skill-details.scss']
})
export class SkillDetailsComponent implements OnInit {
    private team: ITeam;

    private skill: ISkill;

    private achievedByTeams: ITeam[] = [];

    private neededForLevels: ILevel[] = [];

    private neededForBadges: IBadge[] = [];

    private achievableSkill: IAchievableSkill;

    private teamSkill: ITeamSkill;

    // private irrelevanceCheckbox: boolean;

    // Event for skill (de)activation and irrelevance setting
    @Output() onSkillChanged = new EventEmitter<IAchievableSkill>();

    constructor(
        private route: ActivatedRoute,
        private teamSkillService: TeamSkillService,
        private teamsSkillsService: TeamsSkillsService,
        private teamsService: TeamsService,
        private levelService: LevelService,
        private badgeService: BadgeService
    ) {}

    ngOnInit(): void {
        this.route.data.subscribe(({ team, skill }) => {
            this.team = team.body[0] ? team.body[0] : team;
            this.skill = skill;
        });
        this.loadData();
    }

    loadData() {
        this.achievedByTeams = [];
        this.neededForLevels = [];
        this.neededForBadges = [];
        this.achievableSkill = new AchievableSkill();

        this.teamSkillService.query({ 'skillId.equals': this.skill.id, 'completedAt.specified': true }).subscribe(res => {
            const teamsId = res.body.map(ts => ts.teamId);
            if (teamsId.length !== 0) {
                this.teamsService.query({ 'id.in': teamsId }).subscribe(teamsRes => {
                    this.achievedByTeams = teamsRes.body;
                });
            }
        });

        this.teamsSkillsService.findAchievableSkill(this.team.id, this.skill.id).subscribe(skill => {
            this.achievableSkill = skill;
        });

        this.levelService.query({ 'skillsId.in': this.skill.id }).subscribe(res => {
            this.neededForLevels = res.body;
        });

        this.badgeService.query({ 'skillsId.in': this.skill.id }).subscribe(res => {
            this.neededForBadges = res.body;
        });
    }

    handleSkillChange(skill: ISkill) {
        this.skill = skill;
        this.loadData();
    }

    getTeamImage(team: ITeam) {
        return team.picture && team.pictureContentType ? `data:${team.pictureContentType};base64,${team.picture}` : '';
    }

    getLevelImage(level: ILevel) {
        return level.picture && level.pictureContentType ? `data:${level.pictureContentType};base64,${level.picture}` : '';
    }

    getBadgeImage(badge: IBadge) {
        return badge.logo && badge.logoContentType ? `data:${badge.logoContentType};base64,${badge.logo}` : '';
    }

    skillAchieved() {
        return this.achievableSkill && !!this.achievableSkill.achievedAt;
    }

    onToggleSkill(isActivated: boolean) {
        this.achievableSkill.achievedAt = isActivated ? moment() : null;
        this.updateSkill();
    }

    updateSkill() {
        console.log(this.achievableSkill);
        this.teamsSkillsService.updateAchievableSkill(this.team.id, this.achievableSkill).subscribe(
            (res: HttpResponse<IAchievableSkill>) => {
                this.achievableSkill = res.body;
                this.onSkillChanged.emit(this.achievableSkill);
            },
            (res: HttpErrorResponse) => {
                console.log(res);
            }
        );
    }
}
