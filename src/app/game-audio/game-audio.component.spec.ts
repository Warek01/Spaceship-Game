import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameAudioComponent } from './game-audio.component';

describe('GameAudioComponent', () => {
  let component: GameAudioComponent;
  let fixture: ComponentFixture<GameAudioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GameAudioComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameAudioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
