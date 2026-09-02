import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar-widget',
  template: `
    <div class="sidebar-widget">
      <ng-content></ng-content>
    </div>
  `
})
export class SidebarWidgetComponent {} 