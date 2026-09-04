import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { AppareilsListComponent } from './pages/appareils/appareils-list/appareils-list.component';
import { FournisseursListComponent } from './pages/fournisseurs/fournisseurs-list/fournisseurs-list.component';
import { CommandesListComponent } from './pages/commandes/commandes-list/commandes-list.component';
import { ClientsListComponent } from './pages/clients/clients-list/clients-list.component';
import { MaintenanceListComponent } from './pages/maintenances/maintenance-list/maintenance-list.component';
import { AlertesListComponent } from './pages/alertes/alertes-list/alertes-list.component';
import { VentesListComponent } from './pages/ventes/ventes-list/ventes-list/ventes-list.component';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { roleGuard } from './guards/role.guard';
import { UtilisateursListComponent } from './pages/utilisateurs/utilisateurs-list/utilisateurs-list.component';
import { ScanAppareilComponent } from './pages/scan/scan-appareil/scan-appareil/scan-appareil.component';
import { CreatePasswordComponent } from './pages/auth-pages/create-password/create-password.component';
import { ForgotPasswordComponent } from './pages/auth-pages/forgot-password/forgot-password.component';
import { ClientDashboardComponent } from './pages/client-dashboard/client-dashboard/client-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title: 'MedTrack ',
      },
      {
        path: 'dashboard',
        component: EcommerceComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        title: 'Tableau de bord | MedTrack ',
      },
      { path: 'espace-client', component: ClientDashboardComponent, canActivate: [roleGuard], data: { roles: ['CLIENT', 'ADMIN', 'TECHNICIEN', 'COMMERCIAL'] }, title: 'Espace client | MedTrack ' },
      {
        path: 'utilisateurs',
        component: UtilisateursListComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        title: 'Utilisateurs | MedTrack '
      },
      {
        path: 'ventes',
        component: VentesListComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'COMMERCIAL'] },
        title: 'Ventes | MedTrack '
      },
      {
        path: 'alertes',
        component: AlertesListComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'TECHNICIEN'] },
        title: 'Alertes | MedTrack '
      },
      {
        path: 'clients',
        component: ClientsListComponent,
        title: 'Clients | MedTrack '
      },
      {
        path: 'maintenance',
        component: MaintenanceListComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'TECHNICIEN'] },
        title: 'Maintenance | MedTrack '
      },
      {
        path: 'appareils',
        component: AppareilsListComponent
      },
      {
        path: 'fournisseurs',
        component: FournisseursListComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'COMMERCIAL'] },
        title: 'Fournisseurs | MedTrack '
      },
      {
        path: 'commandes',
        component: CommandesListComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'COMMERCIAL'] },
        title: 'Commandes | MedTrack '
      },
      {
        path: 'calendar',
        component: CalenderComponent,
        title: 'Angular Calender | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'profile',
        component: ProfileComponent,
        title: 'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'form-elements',
        component: FormElementsComponent,
        title: 'Angular Form Elements Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'basic-tables',
        component: BasicTablesComponent,
        title: 'Angular Basic Tables Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'blank',
        component: BlankComponent,
        title: 'Angular Blank Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'invoice',
        component: InvoicesComponent,
        title: 'Angular Invoice Details Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'line-chart',
        component: LineChartComponent,
        title: 'Angular Line Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'bar-chart',
        component: BarChartComponent,
        title: 'Angular Bar Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'alerts',
        component: AlertsComponent,
        title: 'Angular Alerts Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'avatars',
        component: AvatarElementComponent,
        title: 'Angular Avatars Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'badge',
        component: BadgesComponent,
        title: 'Angular Badges Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'buttons',
        component: ButtonsComponent,
        title: 'Angular Buttons Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'images',
        component: ImagesComponent,
        title: 'Angular Images Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'videos',
        component: VideosComponent,
        title: 'Angular Videos Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
    ]
  },
  { path: 'signin', component: SignInComponent, canActivate: [guestGuard], title: 'Sign In | MedTrack ' },
  { path: 'signup', component: SignUpComponent, canActivate: [guestGuard], title: 'Sign Up | MedTrack ' },
  { path: 'reset-password', component: ForgotPasswordComponent, title: 'Mot de passe oublié | MedTrack ' },
{ path: 'create-password', component: CreatePasswordComponent, title: 'Créer mon mot de passe | MedTrack ' },
  { path: 'scan/:id', component: ScanAppareilComponent, title: 'Scan appareil | MedTrack ' },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Angular NotFound Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
];