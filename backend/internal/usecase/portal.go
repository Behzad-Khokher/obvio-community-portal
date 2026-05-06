package usecase

import (
	"github.com/behzad/obvio/internal/domain/portal"
	portalRepo "github.com/behzad/obvio/internal/domain/portal/repository"
)

type PortalUsecase struct {
	repo portalRepo.PortalRepository
}

func NewPortalUsecase(r portalRepo.PortalRepository) *PortalUsecase {
	return &PortalUsecase{repo: r}
}

func (u *PortalUsecase) ListPortals() ([]portal.Portal, error) {
	return u.repo.FindAll()
}

func (u *PortalUsecase) GetPortal(id uint) (*portal.Portal, error) {
	return u.repo.FindByID(id)
}

func (u *PortalUsecase) CreatePortal(p *portal.Portal) error {
	return u.repo.Create(p)
}

func (u *PortalUsecase) UpdatePortal(id uint, input *portal.Portal) (*portal.Portal, error) {
	p, err := u.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	p.Name = input.Name
	p.Location = input.Location
	p.Description = input.Description
	return p, u.repo.Update(p)
}

func (u *PortalUsecase) DeletePortal(id uint) error {
	return u.repo.Delete(id)
}
