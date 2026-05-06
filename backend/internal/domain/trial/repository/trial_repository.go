package repository

import "github.com/behzad/obvio/internal/domain/trial"

type TrialRepository interface {
	FindByPortalID(portalID uint) ([]trial.Trial, error)
	FindByID(id uint) (*trial.Trial, error)
	Create(t *trial.Trial) error
	Update(t *trial.Trial) error
	Delete(id uint) error
}
