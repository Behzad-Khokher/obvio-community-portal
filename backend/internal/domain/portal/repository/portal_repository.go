package repository

import "github.com/behzad/obvio/internal/domain/portal"

type PortalRepository interface {
	FindAll() ([]portal.Portal, error)
	FindByID(id uint) (*portal.Portal, error)
	Create(p *portal.Portal) error
	Update(p *portal.Portal) error
	Delete(id uint) error
}
