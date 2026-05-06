package repository

import "github.com/behzad/obvio/internal/domain/event"

type EventRepository interface {
	FindByTrialID(trialID uint) ([]event.Event, error)
	FindByID(id uint) (*event.Event, error)
	Create(e *event.Event) error
	Update(e *event.Event) error
	Delete(id uint) error
	FindByPortalID(portalID uint) ([]event.Event, error)
}
