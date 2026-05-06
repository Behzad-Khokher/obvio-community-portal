package persistence

import (
	"github.com/behzad/obvio/internal/domain/event"
	"gorm.io/gorm"
)

type eventRepo struct {
	db *gorm.DB
}

func NewEventRepo(db *gorm.DB) *eventRepo {
	return &eventRepo{db: db}
}

func (r *eventRepo) FindByTrialID(trialID uint) ([]event.Event, error) {
	var events []event.Event
	err := r.db.Where("trial_id = ?", trialID).Find(&events).Error
	return events, err
}

func (r *eventRepo) FindByID(id uint) (*event.Event, error) {
	var e event.Event
	err := r.db.First(&e, id).Error
	return &e, err
}

func (r *eventRepo) Create(e *event.Event) error {
	return r.db.Create(e).Error
}

func (r *eventRepo) Update(e *event.Event) error {
	return r.db.Save(e).Error
}

func (r *eventRepo) Delete(id uint) error {
	return r.db.Delete(&event.Event{}, id).Error
}

func (r *eventRepo) FindByPortalID(portalID uint) ([]event.Event, error) {
	var events []event.Event
	err := r.db.
		Joins("JOIN trials ON trials.id = events.trial_id").
		Where("trials.portal_id = ?", portalID).
		Find(&events).Error
	return events, err
}
