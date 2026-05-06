package persistence

import (
	"github.com/behzad/obvio/internal/domain/portal"
	"gorm.io/gorm"
)

type portalRepo struct {
	db *gorm.DB
}

func NewPortalRepo(db *gorm.DB) *portalRepo {
	return &portalRepo{db: db}
}

func (r *portalRepo) FindAll() ([]portal.Portal, error) {
	var portals []portal.Portal
	err := r.db.Find(&portals).Error
	return portals, err
}

func (r *portalRepo) FindByID(id uint) (*portal.Portal, error) {
	var p portal.Portal
	err := r.db.First(&p, id).Error
	return &p, err
}

func (r *portalRepo) Create(p *portal.Portal) error {
	return r.db.Create(p).Error
}

func (r *portalRepo) Update(p *portal.Portal) error {
	return r.db.Save(p).Error
}

func (r *portalRepo) Delete(id uint) error {
	return r.db.Delete(&portal.Portal{}, id).Error
}
