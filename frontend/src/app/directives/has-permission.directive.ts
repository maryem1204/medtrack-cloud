import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { Module, Action } from '../config/permissions.config';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit {
  private module!: Module;
  private action!: Action;

  @Input() set appHasPermission(value: [Module, Action]) {
    [this.module, this.action] = value;
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    if (!this.module) return;
    this.viewContainer.clear();
    if (this.authService.hasPermission(this.module, this.action)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}